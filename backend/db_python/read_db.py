# pip install "psycopg[binary]" python-dotenv
import os
from dotenv import load_dotenv
import psycopg

load_dotenv("../../frontend/.env")

CFG = dict(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    dbname=os.getenv("DB_NAME"),
    sslmode="require",
)

def read_users():
    with psycopg.connect(**CFG) as conn, conn.cursor() as cur:
        print("Available tables:")
        cur.execute("""SELECT table_name FROM information_schema.tables
                       WHERE table_schema='public' ORDER BY 1;""")
        for (t,) in cur.fetchall(): print("-", t)
        print("---\nUsers table data:")
        cur.execute("SELECT * FROM users ORDER BY id;")
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        if not rows: return print("No users found.")
        for i, r in enumerate(rows, 1):
            print(f"User {i}:"); [print(f"  {k}: {v}") for k, v in zip(cols, r)]; print("---")

def read_experiences():
    with psycopg.connect(**CFG) as conn, conn.cursor() as cur:
        cur.execute("""SELECT id, user_id, skill, years_of_experience
                       FROM user_experiences ORDER BY user_id, skill;""")
        rows = cur.fetchall()
        print(f"Found {len(rows)} experiences:\n---")
        for id_, uid, skill, yrs in rows:
            print(f"ID:{id_}  User:{uid}  Skill:{skill}  Years:{yrs}\n---")
        return rows

def read_experiences_by_user_id(user_id):
    with psycopg.connect(**CFG) as conn, conn.cursor() as cur:
        cur.execute("""SELECT id, user_id, skill, years_of_experience
                       FROM user_experiences WHERE user_id=%s ORDER BY skill;""", (user_id,))
        rows = cur.fetchall()
        print(f"Found {len(rows)} for user {user_id}:")
        for _, _, skill, yrs in rows: print(f"{skill} ({yrs} years)")
        return rows

if __name__ == "__main__":
    read_users()
    read_experiences()
