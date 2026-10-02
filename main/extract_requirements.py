import os
from dotenv import load_dotenv
from tavily import TavilyClient
from openai import OpenAI

load_dotenv()

# -----------------------------
# TAVILY WEB SEARCH
# -----------------------------

tavily_key = os.getenv("TAVILY_API_KEY")

if not tavily_key:
    print("Tavily API key not found")
    exit()

tavily = TavilyClient(api_key=tavily_key)

# -----------------------------
# ASI CLOUD LLM
# -----------------------------

asi_key = os.getenv("ASI_CLOUD_KEY")

if not asi_key:
    print("ASI Cloud API key not found")
    exit()

llm = OpenAI(
    api_key=asi_key,
    base_url="https://llm.c.singularitynet.io/v1"
)

# -----------------------------
# USER QUESTION
# -----------------------------

question = input("\nWhat do you want to check? ")

print("\nSearching the web...\n")

# -----------------------------
# SEARCH
# -----------------------------

search = tavily.search(
    query=question,
    search_depth="advanced",
    max_results=5
)

# Collect evidence
evidence = ""

for i, result in enumerate(search["results"], 1):
    evidence += f"""
SOURCE {i}
Title: {result["title"]}
URL: {result["url"]}
Content:
{result["content"]}

-------------------------
"""

print("Web evidence collected.")

# -----------------------------
# ASI EXTRACTS REQUIREMENTS
# -----------------------------

prompt = f"""
You are an evidence extraction system.

The user asked:

{question}

Below are web search results:

{evidence}

Extract only requirements, conditions, limits,
eligibility criteria, or factual conditions that
are explicitly supported by the sources.

Do NOT make the final decision.

Return the information in this format:

REQUIREMENT:
VALUE:
CONDITION:
SOURCE:

If the sources disagree, clearly mention the disagreement.

Do not invent missing information.
"""

print("\nAnalyzing evidence...\n")

response = llm.chat.completions.create(
    model="minimax/minimax-m3",
    messages=[
        {
            "role": "user",
            "content": prompt
        }
    ]
)

answer = response.choices[0].message.content

print("===== EXTRACTED EVIDENCE =====")
print(answer)

print("\n===== SOURCES =====")

for i, result in enumerate(search["results"], 1):
    print(f"{i}. {result['title']}")
    print(result["url"])