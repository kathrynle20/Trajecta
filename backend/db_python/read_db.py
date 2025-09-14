from typing import List, Dict, Tuple
from dotenv import load_dotenv
import psycopg
import os
import numpy as np

try:
    from sklearn.neighbors import NearestNeighbors
    SKLEARN = True
except Exception:
    SKLEARN = False

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

CFG = dict(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    dbname=os.getenv("DB_NAME"),
    sslmode=os.getenv("DB_SSLMODE", "require"),
)

def fetch_users_min():
    with psycopg.connect(**CFG) as conn, conn.cursor() as cur:
        cur.execute("SELECT id, email, name, interests FROM users ORDER BY created_at;")
        return cur.fetchall()

def fetch_roadmap_levels_for_users(user_ids: List[str]) -> Dict[str, Dict[str, int]]:
    if not user_ids: return {}
    with psycopg.connect(**CFG) as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT user_id, title, COALESCE((data->>'level')::int, 0) AS lvl
            FROM roadmap_nodes
            WHERE user_id = ANY(%s);
        """, (user_ids,))
        out: Dict[str, Dict[str,int]] = {}
        for uid, title, lvl in cur.fetchall():
            out.setdefault(uid, {})[title] = int(lvl or 0)
        return out

def build_interest_vocab(users_rows) -> List[str]:
    vocab = set()
    for _,_,_, interests in users_rows:
        if interests:
            vocab.update(interests)
    return sorted(vocab)

def users_to_matrix(users_rows, vocab: List[str]) -> Tuple[np.ndarray, List[str]]:
    idx = {t:i for i,t in enumerate(vocab)}
    X = np.zeros((len(users_rows), len(vocab)), dtype=float)
    ids = []
    for r, (uid, email, name, interests) in enumerate(users_rows):
        ids.append(uid)
        if interests:
            for t in interests:
                if t in idx:
                    X[r, idx[t]] = 1.0
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    norms[norms==0] = 1.0
    X = X / norms
    return X, ids

def find_matches_by_interests(target_user_id: str, k: int = 5) -> List[Tuple[str, float]]:
    users = fetch_users_min()
    if not users: return []
    vocab = build_interest_vocab(users)
    X, ids = users_to_matrix(users, vocab)
    if target_user_id not in ids:
        raise ValueError(f"User {target_user_id} not found.")
    t_idx = ids.index(target_user_id)
    if SKLEARN and X.shape[0] > 1:
        nn = NearestNeighbors(n_neighbors=min(k+1, X.shape[0]), metric="cosine")
        nn.fit(X)
        distances, indices = nn.kneighbors(X[t_idx:t_idx+1], return_distance=True)
        pairs = [(ids[j], 1.0 - float(dist)) for dist, j in zip(distances[0], indices[0]) if j != t_idx]
    else:
        sims = (X @ X[t_idx])
        pairs = [(ids[j], float(sims[j])) for j in range(len(ids)) if j != t_idx]
        pairs.sort(key=lambda x: x[1], reverse=True)
        pairs = pairs[:k]
    pairs.sort(key=lambda x: x[1], reverse=True)
    return pairs[:k]

def pretty_print_matches(target_user_id: str, k: int = 5):
    users = fetch_users_min()
    id2user = {uid: (email, name, interests) for uid, email, name, interests in users}
    matches = find_matches_by_interests(target_user_id, k=k)
    print(f"\nBest {k} matches for {id2user[target_user_id][1] or id2user[target_user_id][0]} ({target_user_id}):")
    for uid, score in matches:
        email, name, interests = id2user[uid]
        print(f"  - {name or email:24s}  sim={score:.3f}  interests={interests}")

def get_people_graph_data(current_user_google_id: str):
    """
    Get all users and their KNN relationships for the people graph.
    Returns data suitable for D3.js visualization.
    """
    try:
        # Import here to avoid circular imports
        import psycopg
        from urllib.parse import urlparse
        import os
        from dotenv import load_dotenv
        
        # Environment variables already loaded at module level
        
        # Database connection using individual environment variables (same as backend)
        db_config = {
            'host': os.getenv("DB_HOST"),
            'port': os.getenv("DB_PORT"),
            'user': os.getenv("DB_USER"),
            'password': os.getenv("DB_PASSWORD"),
            'dbname': os.getenv("DB_NAME"),
            'sslmode': os.getenv("DB_SSLMODE", "require")
        }
        
        # Check if we have the required config
        missing_vars = [k for k, v in db_config.items() if not v and k != 'sslmode']
        if missing_vars:
            raise ValueError(f"Missing database environment variables: {missing_vars}")
        
        # Fetch all users from PostgreSQL
        with psycopg.connect(**db_config) as conn:
            with conn.cursor() as cur:
                # Get all users with their basic info
                cur.execute("""
                    SELECT id, email, name, avatar_url, google_id, bio, created_at
                    FROM users 
                    ORDER BY created_at DESC
                """)
                users_data = cur.fetchall()
                
                # Get user experiences (interests) - assuming this table structure
                cur.execute("""
                    SELECT id, skill, years_of_experience
                    FROM user_experiences
                """)
                experiences_data = cur.fetchall()
        
        # Process users data
        vertices = []
        user_lookup = {}
        current_user_internal_id = None
        
        # Create a mapping of experiences by user ID
        experiences_by_user = {}
        for user_id, skill, years in experiences_data:
            if user_id not in experiences_by_user:
                experiences_by_user[user_id] = []
            experiences_by_user[user_id].append({"skill": skill, "years": years})
        
        for user_id, email, name, avatar_url, google_id, bio, created_at in users_data:
            user_interests = experiences_by_user.get(user_id, [])
            interest_names = [exp["skill"] for exp in user_interests]
            
            # Check if this is the current user
            is_current_user = google_id == current_user_google_id
            if is_current_user:
                current_user_internal_id = user_id
            
            user_node = {
                "id": user_id,
                "google_id": google_id,
                "name": name or email,
                "email": email,
                "avatar_url": avatar_url,
                "bio": bio,
                "interests": interest_names,
                "is_current_user": is_current_user,
                "created_at": str(created_at) if created_at else None
            }
            
            vertices.append(user_node)
            user_lookup[user_id] = user_node
        
        # Calculate KNN relationships if we have a current user
        edges = []
        knn_similarities = []
        
        if current_user_internal_id and len(vertices) > 1:
            try:
                # Use the existing KNN function
                matches = find_matches_by_interests(current_user_internal_id, k=min(5, len(vertices)-1))
                
                for match_user_id, similarity in matches:
                    if match_user_id in user_lookup:
                        # Create edge from current user to similar user
                        edge = {
                            "source": current_user_internal_id,
                            "target": match_user_id,
                            "similarity": similarity,
                            "type": "similarity"
                        }
                        edges.append(edge)
                        
                        # Store for later ranking
                        knn_similarities.append({
                            "user_id": match_user_id,
                            "user": user_lookup[match_user_id],
                            "similarity": similarity
                        })
                        
            except Exception as e:
                print(f"Warning: Could not calculate KNN: {e}")
        
        # Sort by similarity for top-5 closest people
        knn_similarities.sort(key=lambda x: x["similarity"], reverse=True)
        top_5_closest = knn_similarities[:5]
        
        return {
            "vertices": vertices,
            "edges": edges,
            "current_user_id": current_user_internal_id,
            "current_user_google_id": current_user_google_id,
            "top_5_closest": top_5_closest,
            "total_users": len(vertices)
        }
        
    except Exception as e:
        return {
            "error": f"Failed to get people graph data: {str(e)}",
            "vertices": [],
            "edges": [],
            "current_user_id": None,
            "top_5_closest": []
        }

if __name__ == "__main__":
    rows = fetch_users_min()
    target = None
    for uid, email, name, _ in rows:
        if email == "alice@example.com":
            target = uid; break
    if not target:
        target = rows[-1][0]
    pretty_print_matches(target_user_id=target, k=8)
