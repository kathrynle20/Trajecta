# script.py  — dynamic AI questions + verdict
# pip install "psycopg[binary]" python-dotenv anthropic
import os, sys, json, hashlib, logging
from dotenv import load_dotenv
from course_recommender import generate_course_roadmap

# Suppress HTTP request logging from httpx (used by Anthropic client)
logging.getLogger("httpx").setLevel(logging.WARNING)
# Suppress course_recommender INFO logs
logging.getLogger("course_recommender").setLevel(logging.WARNING)

# Load environment variables - try multiple paths and encodings
env_paths = [
    '../../frontend/.env',
    '../.env', 
    '.env'
]

env_loaded = False
for env_path in env_paths:
    if env_loaded:
        break
    for encoding in ['utf-16', 'utf-8', 'latin-1']:
        try:
            load_dotenv(dotenv_path=env_path, encoding=encoding)
            env_loaded = True
            break
        except (UnicodeDecodeError, FileNotFoundError):
            continue

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
USE_LLM = bool(ANTHROPIC_API_KEY)

# Models: fast model for QUESTIONS, higher-quality for VERDICT
MODEL_QUESTIONS = os.getenv("ANTHROPIC_MODEL_QUESTIONS", "claude-3-haiku-20240307")
MODEL_VERDICT   = os.getenv("ANTHROPIC_MODEL_VERDICT", "claude-sonnet-4-20250514")

def _require_llm():
    if not USE_LLM:
        raise RuntimeError("Missing ANTHROPIC_API_KEY; cannot generate questions with AI.")

def _anthropic_client():
    from anthropic import Anthropic
    return Anthropic(api_key=ANTHROPIC_API_KEY)

def _llm_json(client, model, prompt, max_tokens=500):
    """
    Ask the model for STRICT JSON (single object). If it returns any text,
    try to extract the first {...} block.
    """
    sys_msg = (
        "You are a fast JSON generator. Return ONLY valid, minified JSON. "
        "No prose, no backticks."
    )
    resp = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=sys_msg,
        messages=[{"role":"user","content":prompt}]
    )
    text = resp.content[0].text.strip()
    # Try strict JSON first
    try:
        return json.loads(text)
    except Exception:
        # Fallback: extract first JSON object
        start = text.find("{")
        end   = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start:end+1])
        raise

# ---------- AI QUESTIONS ----------
def generate_questions(seed: dict) -> dict:
    """
    seed keys (optional): interests_hint (list[str] or str), count_min, count_max, language
    """
    _require_llm()
    client = _anthropic_client()

    interests_hint = seed.get("interests_hint", [])
    if isinstance(interests_hint, str):
        interests_hint = [interests_hint]
    count_min = int(seed.get("count_min", 4))
    count_max = int(seed.get("count_max", 10))
    language  = seed.get("language", "English")

    # Keep prompt VERY compact so it’s quick
    prompt = f"""
Return a JSON questionnaire with these fields:
- version: "v1"
- questions: array of 4–10 items. Each item fields:
  id (slug), prompt (in {language}), type in ["single","multi","scale","quiz","short"],
  options (array for single/multi/quiz), scale for "scale" as [min,max,label_min,label_max],
  correct (only for quiz; one of options), topic_tag (e.g., math/cs/ai/...).
Constraints:
- Tailor to interests hint: {interests_hint}.
- Include 2–4 interest questions, 1–2 quick level checks (quiz/scale),
  and 1–2 logistics/preferences (time per week, learning style).
- Keep text concise. No explanations, only JSON.
"""

    obj = _llm_json(client, MODEL_QUESTIONS, prompt, max_tokens=450)

    # Clamp question count (safety)
    qs = obj.get("questions", [])
    if len(qs) < count_min:
        qs = qs + qs[:max(0, count_min - len(qs))]
    if len(qs) > count_max:
        qs = qs[:count_max]
    obj["questions"] = qs
    return obj

# ---------- VERDICT (fast heuristic; optional LLM polish) ----------
CATALOG = [
  # Math & Statistics
  {"id":"math_found","title":"Math Foundations (Algebra & Calc)","tags":["math"],"level":0},
  {"id":"lin_alg","title":"Linear Algebra Essentials","tags":["math"],"level":1},
  {"id":"stats_intro","title":"Introduction to Statistics","tags":["stats","math"],"level":0},
  
  # Computer Science & Programming
  {"id":"python_intro","title":"Python Programming for Everyone","tags":["cs","web","data"],"level":0},
  {"id":"ds_algo","title":"Data Structures & Algorithms","tags":["cs","algorithms"],"level":1},
  {"id":"web_fullstack","title":"Full-Stack Web Basics (HTML/CSS/JS)","tags":["web","cs","systems"],"level":0},
  
  # AI & Machine Learning
  {"id":"ml_intro","title":"Intro to Machine Learning","tags":["ml","ai","stats"],"level":1},
  {"id":"ml_projects","title":"ML Projects: From Notebook to App","tags":["ml","ai","data"],"level":2},
  {"id":"nlp_intro","title":"NLP Fundamentals","tags":["nlp","ai"],"level":1},
  {"id":"deep_learning","title":"Deep Learning & Neural Networks","tags":["ml","ai","math"],"level":2},
  
  # Data Science & Analytics
  {"id":"data_analytics","title":"Practical Data Analytics with Python","tags":["data","stats"],"level":1},
  {"id":"big_data","title":"Big Data Processing & Analysis","tags":["data","systems"],"level":2},
  
  # Physics & Astronomy
  {"id":"physics_intro","title":"Introduction to Physics","tags":["physics","math"],"level":0},
  {"id":"astronomy_intro","title":"Introduction to Astronomy","tags":["astronomy","physics"],"level":0},
  {"id":"astrophysics","title":"Astrophysics & Cosmology","tags":["astronomy","physics","math"],"level":2},
  {"id":"observational_astro","title":"Observational Astronomy & Telescopes","tags":["astronomy","physics"],"level":1},
  {"id":"planetary_science","title":"Planetary Science & Exploration","tags":["astronomy","physics"],"level":1},
  {"id":"stellar_evolution","title":"Stellar Evolution & Stellar Physics","tags":["astronomy","physics","math"],"level":2},
  
  # Biology & Life Sciences
  {"id":"bio_intro","title":"Introduction to Biology","tags":["biology"],"level":0},
  {"id":"genetics","title":"Genetics & Molecular Biology","tags":["biology","data"],"level":1},
  {"id":"bioinformatics","title":"Bioinformatics & Computational Biology","tags":["biology","cs","data"],"level":2},
  
  # Economics & Social Sciences
  {"id":"econ_intro","title":"Introduction to Economics","tags":["economics","math"],"level":0},
  {"id":"econ_data","title":"Econometrics & Data","tags":["economics","stats","data"],"level":2},
  {"id":"behavioral_econ","title":"Behavioral Economics","tags":["economics","psychology"],"level":1},
  
  # Robotics & Engineering
  {"id":"robotics_intro","title":"Robotics Basics","tags":["robotics","physics"],"level":1},
  {"id":"mechatronics","title":"Mechatronics & Control Systems","tags":["robotics","engineering"],"level":2},
  {"id":"quantum_intro","title":"Introduction to Quantum Computing","tags":["quantum","physics","cs"],"level":2},
  
  # Humanities & Arts
  {"id":"art_history","title":"Art History & Appreciation","tags":["art","history"],"level":0},
  {"id":"digital_humanities","title":"Digital Humanities & Technology","tags":["art","history","cs"],"level":1},
  {"id":"linguistics","title":"Introduction to Linguistics","tags":["languages","nlp"],"level":1},
  
  # Education & Design
  {"id":"pedagogy","title":"Educational Psychology & Pedagogy","tags":["education","psychology"],"level":1},
  {"id":"ux_design","title":"User Experience Design","tags":["design","web"],"level":1},
  {"id":"instructional_design","title":"Instructional Design & Learning Technology","tags":["education","design"],"level":2},
]

def _hours_score(s):
    return {"<2h":0,"2–4h":1,"5–7h":2,"8–12h":3,"13+h":4}.get(s,1)

def _estimate_levels(ans):
    base = {"math":0,"programming":0,"study":0}
    m = ans.get("self", {})  # e.g., {"math":2,"programming":3,"study":1}
    for k in base:
        try: base[k] = max(0,min(4,int(m.get(k,0))))
        except: pass
    # simple boosts from quiz correctness
    quiz = ans.get("quiz", {})  # {"math": true/false, "data": true/false, "cs": true/false}
    if quiz.get("math"): base["math"] += 1
    if quiz.get("cs"): base["programming"] += 1
    if quiz.get("data"): base["study"] += 1
    for k in base: base[k] = max(0,min(4,base[k]))
    return base

def _score(course, interests, levels, goal, hrs):
    if not set(interests).intersection(course["tags"]):
        return -1e9
    score = 2.0 * len(set(interests).intersection(course["tags"]))
    # align level
    if "ml" in course["tags"] or "ai" in course["tags"] or "nlp" in course["tags"]:
        lvl = 0.5*levels["math"] + 0.5*levels["programming"]
    elif "math" in course["tags"]:
        lvl = levels["math"]
    elif "cs" in course["tags"] or "web" in course["tags"]:
        lvl = levels["programming"]
    elif "data" in course["tags"] or "stats" in course["tags"]:
        lvl = 0.5*levels["math"] + 0.5*levels["study"]
    elif "astronomy" in course["tags"] or "physics" in course["tags"]:
        lvl = 0.7*levels["math"] + 0.3*levels["study"]
    elif "biology" in course["tags"]:
        lvl = 0.5*levels["study"] + 0.5*levels["programming"]
    elif "art" in course["tags"] or "history" in course["tags"]:
        lvl = levels["study"]
    else:
        lvl = 0.5*levels["programming"] + 0.5*levels["study"]
    score += 1.5 * (1.0 - min(1.5, abs(course["level"] - lvl))/1.5)
    if goal in ["build projects","career switch"] and course["id"] in ["ml_projects","web_fullstack","data_analytics"]:
        score += 1.0
    if goal in ["get foundations","pass a class"] and course["id"] in ["math_found","python_intro","lin_alg","ds_algo","astronomy_intro","physics_intro"]:
        score += 1.0
    if goal == "research prep" and course["id"] in ["nlp_intro","lin_alg","econ_data","astrophysics","stellar_evolution"]:
        score += 0.7
    # Boost astronomy courses if astronomy is in interests
    if "astronomy" in interests and "astronomy" in course["tags"]:
        score += 1.5
    score += 0.1 * _hours_score(hrs)
    return score

def make_verdict(payload: dict) -> dict:
    """
    payload example:
    {
      "interests": ["ml","data","cs"],
      "top3": ["ml","data","cs"],
      "goal": "build projects",
      "hours": "5–7h",
      "self": {"math":2,"programming":3,"study":1},
      "quiz": {"math": true, "data": true, "cs": true}
    }
    """
    interests = list(dict.fromkeys((payload.get("top3") or []) + (payload.get("interests") or [])))
    levels = _estimate_levels(payload)
    goal = payload.get("goal","")
    hours = payload.get("hours","")

    scored = []
    for c in CATALOG:
        s = _score(c, interests, levels, goal, hours)
        if s > -1e8: scored.append((s,c))
    scored.sort(key=lambda x: x[0], reverse=True)
    picks = [c for _,c in scored[:5]]

    # Use original seed interests for topic-specific generation
    seed_interests_raw = payload.get("seed_interests", "")
    seed_interests_list = [s.strip() for s in seed_interests_raw.split(",") if s.strip()] if seed_interests_raw else []
    
    # Determine the primary topic from seed interests or inferred interests
    primary_topic = seed_interests_list[0] if seed_interests_list else (interests[0] if interests else "artificial intelligence")
    
    # Generate personalized advisor pack based on user interests
    advisor_seed = {
        "topic": primary_topic,
        "interests_hint": seed_interests_list if seed_interests_list else interests,
        "goal": goal or "build expertise in the chosen field",
        "role": "student",
        "gaps": ["mathematics", "statistics"] if "math" not in interests else ["programming", "data analysis"],
        "language": "English",
        "levels": {
            "Mathematics": "Advanced" if levels["math"] >= 3 else "Intermediate" if levels["math"] >= 2 else "Beginner",
            "Programming": "Advanced" if levels["programming"] >= 3 else "Intermediate" if levels["programming"] >= 2 else "Beginner",
            "Statistics": "Advanced" if levels["study"] >= 3 else "Intermediate" if levels["study"] >= 2 else "Beginner",
            "Machine Learning": "Advanced" if "ml" in interests and levels["programming"] >= 2 else "Intermediate" if "ml" in interests else "Beginner"
        }
    }
    
    advisor_pack = generate_advisor_pack(advisor_seed)
    
    # Generate course roadmap using the same client
    client = _anthropic_client() if USE_LLM else None
    vertices, edges = generate_course_roadmap(
        advisor_pack.get("advisor_description", ""),
        advisor_pack.get("conversation_transcript", ""),
        advisor_pack.get("skill_levels", []),
        client=client
    )

    out = {
        "summary": {
            "primary_topics": interests[:3],
            "estimated_levels": levels,
            "study_time": hours,
            "goal": goal
        },
        "recommendations": picks,
        "questions": payload.get("questions", []),
        "answers": payload.get("answers", {}),
        "advisor_description": advisor_pack.get("advisor_description", ""),
        "conversation_transcript": advisor_pack.get("conversation_transcript", ""),
        "skill_levels": advisor_pack.get("skill_levels", []),
        "roadmap_vertices": vertices,
        "roadmap_edges": edges
    }

    # Optional short polish (kept tiny for latency)
    if USE_LLM:
        try:
            client = _anthropic_client()
            content = json.dumps(out, ensure_ascii=False)
            resp = client.messages.create(
                model=MODEL_VERDICT,
                max_tokens=220,
                system="You are a concise academic advisor. Return JSON with a 'rationales' object mapping course.id -> short rationale (1 sentence).",
                messages=[{"role":"user","content": f"Add rationales to this JSON and return JSON only:\n{content}"}]
            )
            refined = json.loads(resp.content[0].text.strip())
            return refined
        except Exception:
            return out
    return out

# ==== BEGIN: free-text relevance ranking (mode="rank") ====

# Light synonym/term expander -> topic weights
TERMS2TOPICS = {
    # math/stats/econ
    "econometrics": [("stats", 0.85), ("economics", 0.7), ("data", 0.6)],
    "regression":   [("stats", 0.8), ("data", 0.7), ("ml", 0.5)],
    "bayesian":     [("stats", 0.8), ("ml", 0.6)],
    "causal":       [("stats", 0.7), ("economics", 0.6), ("data", 0.5)],
    "algebra":      [("math", 0.8)],
    "calculus":     [("math", 0.8)],
    "probability":  [("math", 0.7), ("stats", 0.6)],

    # physics/space/astronomy
    "space":        [("astronomy", 0.8), ("physics", 0.7), ("math", 0.35), ("robotics", 0.3)],
    "astronomy":    [("astronomy", 1.0), ("physics", 0.75), ("math", 0.35)],
    "astrophysics": [("astronomy", 0.9), ("physics", 0.85), ("math", 0.4)],
    "cosmology":    [("astronomy", 0.9), ("physics", 0.8), ("math", 0.5)],
    "planetary":    [("astronomy", 0.8), ("physics", 0.6)],
    "stellar":      [("astronomy", 0.8), ("physics", 0.7), ("math", 0.4)],
    "galaxy":       [("astronomy", 0.8), ("physics", 0.6)],
    "telescope":    [("astronomy", 0.7), ("physics", 0.5)],
    "observational":[("astronomy", 0.8), ("physics", 0.6)],

    # cs/web/systems
    "database":     [("data", 0.6), ("cs", 0.5)],
    "frontend":     [("web", 0.8), ("design", 0.5)],
    "backend":      [("web", 0.6), ("systems", 0.6), ("cs", 0.5)],
    "full stack":   [("web", 0.9), ("cs", 0.5)],
    "api":          [("web", 0.7), ("systems", 0.4)],
    "docker":       [("systems", 0.7), ("cs", 0.4)],

    # ai/ml/nlp/robotics
    "neural network": [("ml", 0.9), ("ai", 0.8)],
    "deep learning":  [("ml", 0.9), ("ai", 0.8)],
    "nlp":            [("nlp", 1.0), ("ai", 0.6)],
    "natural language processing": [("nlp", 1.0), ("ai", 0.6)],
    "reinforcement learning": [("ml", 0.8), ("ai", 0.7)],
    "robotics":      [("robotics", 1.0), ("cs", 0.5), ("physics", 0.6)],

    # bio
    "genomics":      [("biology", 0.8), ("data", 0.5)],
    "bioinformatics":[("biology", 0.7), ("cs", 0.6), ("data", 0.5)],

    # design/education/history/art
    "ux":            [("design", 0.8), ("web", 0.4)],
    "typography":    [("design", 0.7)],
    "pedagogy":      [("education", 0.8)],
    "historiography":[("history", 0.9)],
    "curation":      [("art", 0.7), ("history", 0.5)],
}

TOPIC_SYNONYMS = {
    "math": ["algebra","calculus","linear algebra","probability","statistics"],
    "stats":["statistics","regression","bayesian","inference"],
    "economics":["econometrics","microeconomics","macroeconomics","game theory"],
    "physics":["mechanics","thermodynamics","electromagnetism","quantum physics","classical physics"],
    "astronomy":["space","cosmology","astrophysics","planetary science","stellar evolution","telescopes","observational astronomy","galaxies","stars","planets","solar system","universe"],
    "quantum":["quantum computing","qiskit","qubits"],
    "cs":["programming","software","computer science","git"],
    "web":["frontend","backend","full stack","api","react","html","css","javascript"],
    "systems":["linux","docker","kubernetes","distributed systems"],
    "algorithms":["data structures","graphs","dp","greedy"],
    "ml":["machine learning","deep learning","neural network","supervised learning"],
    "ai":["artificial intelligence","agents","planning","ai ethics"],
    "nlp":["natural language processing","text","language model","translation"],
    "data":["sql","pandas","analytics","visualization","etl","database"],
    "biology":["molecular biology","genomics","bioinformatics"],
    "robotics":["ros","sensors","control","kinematics"],
    "history":["archives","historiography","primary sources"],
    "languages":["linguistics","phonetics","syntax","translation"],
    "art":["museum","curation","digital humanities"],
    "education":["pedagogy","assessment","learning science"],
    "design":["ux","typography","design systems","interaction design"],
}

ALL_TOPICS = list(TOPIC_SYNONYMS.keys())

def _text_score_for_topic(text: str, topic: str) -> float:
    """Tiny keyword hit counter as a soft boost from free text."""
    if not text: return 0.0
    t = text.lower()
    hits = 0
    for kw in TOPIC_SYNONYMS.get(topic, []):
        if kw in t: hits += 1
    return min(0.3, 0.1 * hits)  # cap small

def _seed_weights_from_term(term: str) -> dict:
    term_l = (term or "").lower().strip()
    weights = {t: 0.0 for t in ALL_TOPICS}
    if not term_l: return weights

    # Exact topic match
    if term_l in weights:
        weights[term_l] = max(weights[term_l], 1.0)

    # Dictionary hits
    for key, pairs in TERMS2TOPICS.items():
        if key in term_l or term_l in key:
            for topic, w in pairs:
                weights[topic] = max(weights[topic], w)

    # Synonym hits
    for topic, syns in TOPIC_SYNONYMS.items():
        for s in syns:
            if s in term_l or term_l in s:
                weights[topic] = max(weights[topic], 0.6)
    return weights

def _normalize_scores(d: dict) -> dict:
    m = max(d.values()) if d else 0.0
    if m <= 0: return d
    return {k: v / m for k, v in d.items()}

def _rank_to_courses(topic_scores: dict, top_k=5):
    # Use your existing CATALOG (from verdict section)
    ranked = []
    for c in CATALOG:
        s = 0.0
        for tag in c["tags"]:
            s += topic_scores.get(tag, 0.0)
        ranked.append((s, c))
    ranked.sort(key=lambda x: x[0], reverse=True)
    return [c for s, c in ranked[:top_k] if s > 0]

def rank_query(payload: dict) -> dict:
    """
    payload = {
      "query": "econometrics",
      "user": {
        "interests": ["ml","data","math"],
        "top3": ["ml","data","cs"],
        "advisor_description": "…",
        "conversation_transcript": "…",
        "skill_levels": [["Mathematics","Beginner"],["Programming","Intermediate"], ...]
      }
    }
    """
    q = (payload.get("query") or "").strip()
    user = payload.get("user", {}) or {}
    interests = set(user.get("interests") or [])
    top3 = set(user.get("top3") or [])
    desc = user.get("advisor_description") or ""
    convo = user.get("conversation_transcript") or ""
    combined_text = f"{desc}\n{convo}".strip()

    # 1) seed scores from the term itself
    scores = _seed_weights_from_term(q)

    # 2) boost by user’s stated interests/top3
    for topic in ALL_TOPICS:
        if topic in interests: scores[topic] += 0.25
        if topic in top3:      scores[topic] += 0.20

    # 3) light boost from advisor description / transcript text
    for topic in ALL_TOPICS:
        scores[topic] += _text_score_for_topic(combined_text, topic)

    # 4) tiny nudge for gaps (Beginner levels) = “relevance to growth”
    gaps = set()
    for name, level in user.get("skill_levels", []):
        lvl = (level or "").lower()
        if "beginner" in lvl:
            name_l = (name or "").lower()
            if "math" in name_l: gaps.add("math")
            if "stat" in name_l: gaps.add("stats")
            if "program" in name_l or "cs" in name_l: gaps.add("cs")
            if "machine learning" in name_l: gaps.add("ml")
    for g in gaps:
        scores[g] += 0.1

    # 5) normalize & rank
    scores = _normalize_scores(scores)
    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)

    # 6) pick courses by these topic weights
    top_courses = _rank_to_courses(scores, top_k=5)

    # reasons: show top 6 with non-zero scores
    explanations = [
        {"topic": t, "score": round(s, 3),
         "reason": (
            ("interest/top3 boost; " if (t in interests or t in top3) else "") +
            ("context match; " if _text_score_for_topic(combined_text, t) > 0 else "") +
            ("term mapping; " if _seed_weights_from_term(q).get(t,0)>0 else "")
         ).strip().rstrip(";")
        }
        for t, s in ranked[:6] if s > 0
    ]

    return {
        "query": q,
        "topic_scores": [{"topic": t, "score": round(s, 4)} for t, s in ranked if s > 0][:10],
        "explanations": explanations,
        "recommended_courses": top_courses
    }

# ==== END: free-text relevance ranking ====

# ---------- ADVISOR PACK (description, transcript, skill levels) ----------
def generate_advisor_pack(seed: dict) -> dict:
    """
    Create:
      - advisor_description: 3–6 sentence third-person summary
      - conversation_transcript: short back-and-forth (Advisor/Student)
      - skill_levels: array of [Name, Level] with Levels in {"Beginner","Intermediate","Advanced"}

    seed (optional) keys:
      topic               (str)  e.g., "artificial intelligence"
      interests_hint      (list[str] or str)
      goal                (str)  e.g., "AI research", "ML engineering"
      role                (str)  e.g., "software developer"
      gaps                (list[str]) e.g., ["mathematics","statistics"]
      language            (str)  default "English"
      transcript_turns    (int)  default 3 (Advisor asks / Student answers)
      levels              (dict) map like {"Mathematics":"Beginner","Programming":"Intermediate", ...}
    """
    language = (seed.get("language") or "English").strip()
    topic = (seed.get("topic") or "artificial intelligence and machine learning").strip()

    # Normalize interests -> list
    interests = seed.get("interests_hint", [])
    if isinstance(interests, str):
        interests = [interests]
    if not interests:
        interests = ["ai", "machine learning", "deep learning"]

    role = seed.get("role") or "software developer"
    goal = seed.get("goal") or "transition into AI research or engineering roles"
    gaps = seed.get("gaps") or ["mathematics", "statistics"]
    transcript_turns = max(2, min(int(seed.get("transcript_turns", 3)), 5))

    # Default skill levels or from seed.levels
    levels = {
        "Mathematics":  "Beginner",
        "Programming":  "Intermediate",
        "Statistics":   "Beginner",
        "Machine Learning": "Beginner",
    }
    for k, v in (seed.get("levels") or {}).items():
        if k in levels and v in {"Beginner","Intermediate","Advanced"}:
            levels[k] = v

    if USE_LLM:
        try:
            client = _anthropic_client()
            
            # Create highly specific prompt based on the topic
            topic_specific_prompt = f"""
You are creating a personalized academic advisor profile for a student interested in {topic}.

Generate STRICT JSON with exactly these keys: advisor_description, conversation_transcript, skill_levels

Requirements:
1. advisor_description: Write 3-6 sentences about a student specifically interested in {topic}. 
   - Mention {topic} explicitly and specific subfields within {topic}
   - Reference their specific interests: {', '.join(interests)}
   - Mention their goal: {goal}
   - Be very specific to {topic}, not generic

2. conversation_transcript: Create a realistic conversation between an Advisor and Student about {topic}.
   - {transcript_turns} question-answer pairs
   - Format: "Advisor: question\\nStudent: answer\\n\\nAdvisor: question\\nStudent: answer"
   - Questions and answers must be VERY specific to {topic}
   - Student answers should show genuine interest in {topic}

3. skill_levels: Array of [skill_name, level] where level is "Beginner", "Intermediate", or "Advanced"
   - Include skills specifically relevant to {topic}
   - If {topic} is biology: include Biology, Genetics, Lab Techniques, Research Methods
   - If {topic} is astronomy: include Astronomy, Physics, Mathematics, Observational Skills  
   - If {topic} is economics: include Economics, Statistics, Data Analysis, Research
   - If {topic} is art: include Art History, Creative Skills, Cultural Studies, Analysis
   - Always include Mathematics and adjust other skills to match the topic

Make everything highly specific to {topic}. Avoid generic academic language.

Topic: {topic}
Student interests: {interests}
Student goal: {goal}
Student gaps: {gaps}
Language: {language}
"""
            
            # Reuse strict JSON helper
            obj = _llm_json(client, MODEL_VERDICT, topic_specific_prompt, max_tokens=600)

            # Light post-validate / coerce
            adv = (obj.get("advisor_description") or "").strip()
            convo = (obj.get("conversation_transcript") or "").strip()
            skl = obj.get("skill_levels") or []
            # Ensure skill levels structure
            def _coerce_levels(x):
                ok_levels = {"Beginner","Intermediate","Advanced"}
                names = ["Mathematics","Programming","Statistics","Machine Learning"]
                out = []
                have = {k for k, _ in x if isinstance(k, str)}
                for name in names:
                    val = None
                    for k, v in x:
                        if k == name and isinstance(v, str) and v in ok_levels:
                            val = v; break
                    if not val:
                        val = levels[name]
                    out.append([name, val])
                return out
            skl = _coerce_levels(skl if isinstance(skl, list) else [])

            return {
                "advisor_description": adv,
                "conversation_transcript": convo,
                "skill_levels": skl
            }
        except Exception:
            # Fall through to template
            pass

    # -------- Fallback (no LLM) --------
    # Build a topic-specific template
    
    # Topic-specific advisor descriptions
    if "astronomy" in topic.lower() or "space" in topic.lower():
        advisor_description = (
            f"Student shows passionate interest in {topic}, particularly in observational astronomy and stellar physics. "
            f"They are eager to understand celestial mechanics, planetary science, and the physics of stars and galaxies. "
            f"Currently studying to {goal} and aims to work with telescopes and space exploration data. "
            f"Strong motivation for learning but needs more foundation in {', '.join(gaps)} to advance in astrophysics research."
        )
        qa = [
            ("What draws you to astronomy and space science?",
             f"I'm captivated by {interests[0]} and want to understand how stars form, evolve, and die, plus discover exoplanets."),
            ("Do you have experience with telescopes and observational techniques?",
             "I've done some amateur stargazing, but I need to learn proper observational methods and data analysis."),
            ("What's your ultimate goal in astronomy?",
             f"I want to work at an observatory or space agency doing research in {interests[0] if interests else 'planetary science'}."),
        ]
        topic_levels = {
            "Astronomy": levels.get("Machine Learning", "Beginner"),
            "Physics": levels.get("Mathematics", "Beginner"), 
            "Mathematics": levels.get("Mathematics", "Beginner"),
            "Observational Skills": "Beginner"
        }
    elif "biology" in topic.lower() or "genetic" in topic.lower():
        advisor_description = (
            f"Student demonstrates keen interest in {topic}, especially molecular biology and genetic research. "
            f"They want to understand cellular processes, DNA sequencing, and biotechnology applications. "
            f"Currently preparing to {goal} with focus on laboratory techniques and research methodology. "
            f"Enthusiastic learner who needs stronger background in {', '.join(gaps)} for advanced biological research."
        )
        qa = [
            ("What aspects of biology excite you most?",
             f"I'm fascinated by {interests[0]} and want to work on genetic engineering, CRISPR technology, and synthetic biology."),
            ("Do you have laboratory experience?",
             "I've done basic lab work in school, but I need more experience with advanced techniques like PCR and gel electrophoresis."),
            ("Where do you see yourself working in biology?",
             f"I want to work in a research lab or biotech company focusing on {interests[0] if interests else 'genetic research'}."),
        ]
        topic_levels = {
            "Biology": levels.get("Machine Learning", "Beginner"),
            "Genetics": "Beginner",
            "Lab Techniques": "Beginner", 
            "Research Methods": levels.get("Statistics", "Beginner")
        }
    elif "economics" in topic.lower() or "finance" in topic.lower():
        advisor_description = (
            f"Student shows strong analytical interest in {topic}, particularly econometrics and financial modeling. "
            f"They want to understand market dynamics, policy analysis, and quantitative economic research. "
            f"Currently working toward {goal} with emphasis on data-driven economic analysis. "
            f"Motivated to learn but requires stronger foundation in {', '.join(gaps)} for advanced economic research."
        )
        qa = [
            ("What interests you about economics and finance?",
             f"I'm drawn to {interests[0]} and want to analyze market behavior, policy impacts, and economic forecasting."),
            ("Do you have experience with economic data analysis?",
             "I understand basic concepts, but I need to learn econometric methods and statistical software like R or Stata."),
            ("What's your career goal in economics?",
             f"I want to work as an economic analyst or researcher focusing on {interests[0] if interests else 'policy analysis'}."),
        ]
        topic_levels = {
            "Economics": levels.get("Machine Learning", "Beginner"),
            "Statistics": levels.get("Statistics", "Beginner"),
            "Data Analysis": levels.get("Programming", "Beginner"),
            "Research": "Beginner"
        }
    else:
        # Generic fallback
        advisor_description = (
            f"Student shows strong interest in {topic}. "
            f"They want to build expertise and understand key concepts in {', '.join(interests[:2])}. "
            f"Currently working as a {role} and aims to {goal}. "
            f"Motivated but needs structured practice in {', '.join(gaps)} to progress."
        )
        qa = [
            ("What specifically interests you about this field?",
             f"I'm fascinated by {interests[0] if interests else topic} and want to develop deep expertise in this area."),
            ("Do you have relevant experience?",
             "I have some background, but I need more structured learning and practice."),
            ("What's your ultimate career goal?",
             f"I want to work professionally in {topic} or do research in {interests[0] if interests else topic}."),
        ]
        topic_levels = levels

    qa = qa[:transcript_turns]
    lines = []
    for q, a in qa:
        lines.append(f"Advisor: {q}")
        lines.append(f"Student: {a}")
        lines.append("")  # blank line between turns
    conversation_transcript = "\n".join(lines).strip()

    skill_levels = [[k, v] for k, v in topic_levels.items()]
    
    graph = generate_course_roadmap(advisor_description, conversation_transcript, skill_levels)

    return {
        "advisor_description": advisor_description,
        "conversation_transcript": conversation_transcript,
        "skill_levels": skill_levels
    }

# ---------- main (append a new mode) ----------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input"})); sys.exit(1)

    raw = sys.argv[1]
    if raw.strip().lower() == "questions":
        try:
            out = generate_questions({"interests_hint":[]})
            print(json.dumps({"input":"questions","output":out}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
        sys.exit(0)

    try:
        payload = json.loads(raw)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON: {e}"})); sys.exit(1)

    mode = payload.get("mode")
    if mode == "questions":
        try:
            out = generate_questions(payload.get("seed", {}))
            print(json.dumps({"input":"questions","output":out}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    elif mode == "verdict":
        try:
            out = make_verdict(payload.get("answers", {}))
            print(json.dumps({"input":"verdict","output":out}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    elif mode in ("blurb","topic_paragraph"):
        try:
            topic = payload.get("topic") or payload.get("subject") or ""
            language = payload.get("language", "English")
            max_words = payload.get("max_words", 90)
            paragraph = generate_topic_paragraph(topic, language, max_words)
            out = {"topic": topic, "language": language, "paragraph": paragraph}
            print(json.dumps({"input":"blurb","output":out}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    elif mode in ("advisor_pack","advisor_profile"):
        try:
            out = generate_advisor_pack(payload.get("seed", {}))
            # Print in the EXACT variable-style format if requested
            if payload.get("format") == "variables":
                print(
                    "advisor_description = " + json.dumps(out["advisor_description"], ensure_ascii=False) + "\n" +
                    "conversation_transcript = " + json.dumps(out["conversation_transcript"], ensure_ascii=False) + "\n" +
                    "skill_levels = " + json.dumps(out["skill_levels"], ensure_ascii=False)
                )
            else:
                print(json.dumps({"input":"advisor_pack","output":out}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    elif mode == "people_graph":
        try:
            from read_db import get_people_graph_data
            current_user_id = payload.get("current_user_id", "")
            out = get_people_graph_data(current_user_id)
            print(json.dumps({"input":"people_graph","output":out}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        print(json.dumps({"error":"Unknown mode; use 'questions', 'verdict', 'blurb', 'advisor_pack', or 'people_graph'."}))
