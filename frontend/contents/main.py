"""
Glass Box AI - FastAPI API Wrapper
Exposes the preserved Python backend pipeline over HTTP for the frontend.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Import the exact pipeline logic from glass_box_backend.py
from backend.glass_box_backend import execute_glass_box_pipeline

load_dotenv()

app = FastAPI(
    title="Glass Box AI Decision API",
    description="Explainable AI Decision Agent powered by Tavily, ASI Cloud LLM, and Hyperon MeTTa",
    version="1.0.0"
)

# Enable CORS for the Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    question: str = Field(..., example="What are the eligibility requirements for Khorana Program?")
    user_info: str = Field(..., example="percentage=82, cgpa=8.2, age=18")

@app.get("/api/health")
def health_check():
    has_tavily = bool(os.getenv("TAVILY_API_KEY"))
    has_asi = bool(os.getenv("ASI_CLOUD_KEY"))
    
    metta_available = False
    try:
        import hyperon
        metta_available = True
    except ImportError:
        metta_available = False

    return {
        "status": "online",
        "system": "Glass Box AI Python Backend",
        "version": "1.0.0",
        "engines": {
            "web_search": "Tavily (API Key Configured: " + ("Yes" if has_tavily else "No") + ")",
            "llm_extraction": "ASI Cloud Minimax-m3 (API Key Configured: " + ("Yes" if has_asi else "No") + ")",
            "symbolic_reasoning": "Hyperon MeTTa (Installed: " + ("Yes" if metta_available else "Symbolic Engine") + ")"
        }
    }

@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if not req.user_info.strip():
        raise HTTPException(status_code=400, detail="User information cannot be empty.")

    try:
        result = execute_glass_box_pipeline(
            question=req.question.strip(),
            user_info=req.user_info.strip()
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"Starting Glass Box AI Python API on port {port}...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
