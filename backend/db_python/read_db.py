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

def read_users_and_roadmaps():
    with psycopg.connect(**CFG) as conn, conn.cursor() as cur:
        # Load all users
        cur.execute("SELECT id, email, name, interests FROM users ORDER BY created_at;")
        users = cur.fetchall()

        for uid, email, name, interests in users:
            print(f"\nUser: {name or email}")
            print(f"  Email: {email}")
            print(f"  Interests: {interests}")

            # Fetch roadmap for this user
            cur.execute("""
                SELECT title, (data->>'level')::int AS level
                FROM roadmap_nodes
                WHERE user_id=%s
                ORDER BY position;
            """, (uid,))
            roadmap = cur.fetchall()

            if roadmap:
                print("  Roadmap:")
                for subject, level in roadmap:
                    print(f"    - ({subject}, {level})")
            else:
                print("  Roadmap: [none]")

if __name__ == "__main__":
    read_users_and_roadmaps()
