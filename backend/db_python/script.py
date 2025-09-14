# script.py  — dynamic AI questions + verdict
# pip install "psycopg[binary]" python-dotenv anthropic
import os, sys, json, hashlib
from dotenv import load_dotenv

# Keep your encoding if you really stored .env as UTF-16, otherwise UTF-8 is safer
load_dotenv(dotenv_path='../../frontend/.env', encoding='utf-16')

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
  {"id":"math_found","title":"Math Foundations (Algebra & Calc)","tags":["math"],"level":0},
  {"id":"lin_alg","title":"Linear Algebra Essentials","tags":["math"],"level":1},
  {"id":"python_intro","title":"Python Programming for Everyone","tags":["cs","web","data"],"level":0},
  {"id":"ds_algo","title":"Data Structures & Algorithms","tags":["cs","algorithms"],"level":1},
  {"id":"ml_intro","title":"Intro to Machine Learning","tags":["ml","ai","stats"],"level":1},
  {"id":"ml_projects","title":"ML Projects: From Notebook to App","tags":["ml","ai","data"],"level":2},
  {"id":"nlp_intro","title":"NLP Fundamentals","tags":["nlp","ai"],"level":1},
  {"id":"data_analytics","title":"Practical Data Analytics with Python","tags":["data","stats"],"level":1},
  {"id":"web_fullstack","title":"Full-Stack Web Basics (HTML/CSS/JS)","tags":["web","cs","systems"],"level":0},
  {"id":"robotics_intro","title":"Robotics Basics","tags":["robotics","physics"],"level":1},
  {"id":"econ_data","title":"Econometrics & Data","tags":["economics","stats","data"],"level":2},
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
    else:
        lvl = 0.5*levels["programming"] + 0.5*levels["study"]
    score += 1.5 * (1.0 - min(1.5, abs(course["level"] - lvl))/1.5)
    if goal in ["build projects","career switch"] and course["id"] in ["ml_projects","web_fullstack","data_analytics"]:
        score += 1.0
    if goal in ["get foundations","pass a class"] and course["id"] in ["math_found","python_intro","lin_alg","ds_algo"]:
        score += 1.0
    if goal == "research prep" and course["id"] in ["nlp_intro","lin_alg","econ_data"]:
        score += 0.7
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

    out = {
        "summary": {
            "primary_topics": interests[:3],
            "estimated_levels": levels,
            "study_time": hours,
            "goal": goal
        },
        "recommendations": picks
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

    # physics/space
    "space":        [("physics", 0.7), ("math", 0.35), ("robotics", 0.3)],
    "astronomy":    [("physics", 0.75), ("math", 0.35)],
    "astrophysics": [("physics", 0.85), ("math", 0.4)],

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
    "physics":["space","astronomy","astrophysics","mechanics","quantum"],
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


# ---------- main ----------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input"})); sys.exit(1)

    raw = sys.argv[1]
    # Backward compatibility: if plain "questions", generate generic set
    if raw.strip().lower() == "questions":
        try:
            out = generate_questions({"interests_hint":[]})
            print(json.dumps({"input":"questions","output":out}, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
        sys.exit(0)

    # Otherwise expect a JSON with {"mode": "...", ...}
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
    else:
        print(json.dumps({"error":"Unknown mode; use 'questions' or 'verdict'."}))
