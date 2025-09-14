import os
from dotenv import load_dotenv
from anthropic import Anthropic
from dotenv import load_dotenv


load_dotenv(dotenv_path='../../frontend/.env', encoding='utf-16')  # BOM-aware

api_key = os.getenv("ANTHROPIC_API_KEY")
print("Loaded API Key:", api_key[:10], "...")  # sanity check

client = Anthropic(api_key=api_key)

resp = client.messages.create(
    model="claude-sonnet-4-0",
    max_tokens=300,
    messages=[{"role": "user", "content": "Solve $d/dx (x^x)$"}],
)

print(resp.content[0].text)
