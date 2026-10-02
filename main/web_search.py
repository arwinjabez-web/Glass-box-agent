import os
from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

api_key = os.getenv("TAVILY_API_KEY")

if not api_key:
    print("ERROR: Tavily API key not found.")
    exit()

client = TavilyClient(api_key=api_key)

query = "minimum eligibility requirements for engineering scholarship India"

response = client.search(
    query=query,
    search_depth="advanced",
    max_results=5
)

print("\nSEARCH RESULTS:\n")

for result in response["results"]:
    print("TITLE:", result["title"])
    print("URL:", result["url"])
    print("CONTENT:", result["content"][:500])
    print("-" * 60)