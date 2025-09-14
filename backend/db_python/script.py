import os
import sys
import json
from dotenv import load_dotenv
from anthropic import Anthropic

# Load .env with utf-16 BOM aware
load_dotenv(dotenv_path='../../frontend/.env', encoding='utf-16')

api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print(json.dumps({"error": "Missing API key"}))
    sys.exit(1)

client = Anthropic(api_key=api_key)

# Get user prompt from Node.js (first argument)
if len(sys.argv) < 2:
    print(json.dumps({"error": "No input provided"}))
    sys.exit(1)

user_input = sys.argv[1]

try:
    resp = client.messages.create(
        model="claude-sonnet-4-0",  # update to the right Anthropic model
        max_tokens=300,
        messages=[{"role": "user", "content": user_input}],
    )
    answer = resp.content[0].text
    print(json.dumps({"input": user_input, "output": answer}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
