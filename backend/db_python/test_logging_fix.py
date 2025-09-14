#!/usr/bin/env python3

import json
import sys
from script import make_verdict

# Test payload
test_payload = {
    "interests": ["ml", "data"],
    "top3": ["ml", "data", "cs"],
    "goal": "research prep",
    "hours": "5-7h",
    "self": {"math": 2, "programming": 3, "study": 1},
    "quiz": {"math": True, "data": True, "cs": True},
    "seed_interests": "ml,data"
}

try:
    result = make_verdict(test_payload)
    # Only print the JSON result, no extra messages
    print(json.dumps({"input": "verdict", "output": result}, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
