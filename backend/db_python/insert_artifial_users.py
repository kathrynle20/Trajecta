import os, random, itertools
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
from dotenv import load_dotenv
import psycopg

load_dotenv("../../frontend/.env")
CFG = dict(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    dbname=os.getenv("DB_NAME"),
    sslmode=os.getenv("DB_SSLMODE", "require"),
)

FIRST_NAMES = ["Noah","Emilia","Samir","Lena","Matthew","Amira","Diego","Yuko","Sofia","Marco",
               "Fatima","Li","Daniel","Nina","Peter","Amélie","Lucas","Hana","Chidi","Aisha",
               "Jonas","Ivy","Ravi","Carla","Mina","Artem","Zara","Mateo","Leila","Owen"]
LAST_NAMES  = ["Chen","Rojas","Khan","Marcus","Ng","Farouk","Santana","Sato","Martin","Rossi",
               "Hassan","Wei","Smith","Koval","Johnson","Dupont","Meyer","Lee","Okafor","Bello",
               "Schmidt","Nguyen","Patel","Silva","Kim","Petrov","Haddad","Alvarez","Hosseini","Brown"]
TOPICS = ["math","cs","ai","ml","nlp","data","economics","history","languages","art",
          "biology","robotics","algorithms","systems","web","physics","quantum","stats","education","design"]

ROADMAP_SUBJECTS = {
    "math": ["Algebra","Calculus","Linear Algebra","Probability"],
    "cs": ["Data Structures","Algorithms","Operating Systems","Networking"],
    "ai": ["Intro to AI","Search & Planning","Agents","AI Ethics"],
    "ml": ["ML Basics","Supervised Learning","Neural Networks","MLOps Fundamentals"],
    "nlp":["Linguistics (Intro)","NLP Fundamentals","Text Classification","Machine Translation"],
    "data":["SQL","Python Pandas","Data Visualization","ETL"],
    "economics":["Microeconomics","Macroeconomics","Econometrics (Intro)","Game Theory"],
    "history":["Research Methods","Historiography","Digital Archives","Academic Writing"],
    "languages":["Phonetics","Grammar & Syntax","Corpus Linguistics","Translation Theory"],
    "art":["Renaissance Art","Modern Art","Digital Humanities","Curation Basics"],
    "biology":["Molecular Biology","Genetics","Genomics (Intro)","Bioinformatics"],
    "robotics":["Kinematics","Sensors & Actuators","Control Basics","ROS (Intro)"],
    "algorithms":["Complexity","Graph Algorithms","DP","Greedy Techniques"],
    "systems":["Compilers (Intro)","Distributed Systems","Databases","Linux Internals"],
    "web":["HTML/CSS","JavaScript","React + TS","API Design"],
    "physics":["Classical Mechanics","Electromagnetism","Thermodynamics","Stat Mech"],
    "quantum":["Quantum Mechanics","Linear Algebra (QM)","Quantum Computing Basics","Qiskit (Intro)"],
    "stats":["Descriptive Stats","Inference","Regression","Causal Inference (Intro)"],
    "education":["Pedagogy Basics","Assessment Design","Learning Science","EdTech Tools"],
    "design":["Design Principles","Typography","Interaction Design","Design Systems"],
}

AVATAR = lambda: f"https://i.pravatar.cc/150?img={random.randint(1, 70)}"

@dataclass
class Persona:
    email: str
    name: str
    avatar_url: str
    bio: str
    interests: List[str]
    roadmap: List[Tuple[str,int]]

def random_persona(existing_emails: set) -> Persona:
    for _ in range(50):
        fn, ln = random.choice(FIRST_NAMES), random.choice(LAST_NAMES)
        base = f"{fn.lower()}.{ln.lower()}"
        email = f"{base}{random.randint(1,9999)}@example.com"
        if email not in existing_emails:
            break
    existing_emails.add(email)
    name = f"{fn} {ln}"
    k = random.randint(3, 6)
    interests = random.sample(TOPICS, k)
    bio = f"{random.choice(['Student','Engineer','Researcher','Teacher','Hobbyist','Analyst'])} interested in {', '.join(interests[:2])}."
    subj_pool = list(itertools.chain.from_iterable(ROADMAP_SUBJECTS[t] for t in interests if t in ROADMAP_SUBJECTS))
    subj_pool = list(dict.fromkeys(subj_pool))
    rcount = max(3, min(6, len(subj_pool))) if subj_pool else 3
    chosen = random.sample(subj_pool or ["Foundations","Reading","Practice"], min(rcount, len(subj_pool) or 3))
    roadmap = [(s, random.randint(1,4)) for s in chosen]
    return Persona(
        email=email, name=name, avatar_url=AVATAR(), bio=bio,
        interests=interests, roadmap=roadmap
    )

def insert_personas(personas: List[Persona]):
    if not personas: return
    with psycopg.connect(**CFG) as conn:
        with conn.cursor() as cur:
            for p in personas:
                cur.execute("""
                    INSERT INTO users (email, name, avatar_url, bio, interests)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO NOTHING
                    RETURNING id;
                """, (p.email, p.name, p.avatar_url, p.bio, p.interests))
                row = cur.fetchone()
                if not row:
                    cur.execute("SELECT id FROM users WHERE email=%s;", (p.email,))
                    row = cur.fetchone()
                user_id = row[0]
                for pos,(subject,level) in enumerate(p.roadmap, start=1):
                    cur.execute("""
                        INSERT INTO roadmap_nodes (user_id, title, description, position, data)
                        VALUES (%s, %s, %s, %s, jsonb_build_object('level', %s));
                    """, (user_id, subject, None, pos, int(level)))
        conn.commit()

def seed_random_users(count: int = 25):
    existing = set()
    with psycopg.connect(**CFG) as conn, conn.cursor() as cur:
        cur.execute("SELECT email FROM users;")
        for (e,) in cur.fetchall(): existing.add(e)
    personas = [random_persona(existing) for _ in range(count)]
    insert_personas(personas)
    print(f"Inserted/merged {count} personas.")

if __name__ == "__main__":
    seed_random_users(count=25)
