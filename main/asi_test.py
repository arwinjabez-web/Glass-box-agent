import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("ASI_CLOUD_KEY")

client = OpenAI(
    api_key=api_key,
    base_url="https://llm.c.singularitynet.io/v1"
)

response = client.chat.completions.create(
    model="minimax/minimax-m3",
    messages=[
        {
            "role": "user",
            "content": "In one sentence, explain what an AI agent is."
        }
    ]
)

print("\nASI CLOUD RESPONSE:\n")
print(response.choices[0].message.content)