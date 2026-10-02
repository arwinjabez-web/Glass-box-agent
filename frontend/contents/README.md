# Glass Box AI - Backend Architecture & Python API

This directory contains the preserved Python backend for **Glass Box AI - Explainable AI Decision Agent**.

## Overview
Glass Box AI provides 100% transparent, explainable decision intelligence using a 4-stage neuro-symbolic pipeline:
1. **Web Evidence Gathering**: Tavily Advanced Search queries official authoritative sources.
2. **AI Requirement Extraction**: SingularityNET ASI Cloud LLM (`minimax/minimax-m3`) parses unstructured legal/admission criteria into deterministic AND/OR JSON groups.
3. **Hyperon MeTTa Symbolic Reasoning**: Formal logic execution using MeTTa queries (`!(if (>= user_value req_value) "PASS" "FAIL")`).
4. **Deterministic Synthesis**: Computes final ELIGIBLE / NOT ELIGIBLE verdict with zero hallucinations.

---

## Files
- `glass_box_backend.py`: The original Python pipeline modularized as `execute_glass_box_pipeline(question, user_info)`. No decision logic was altered or simplified.
- `main.py`: Lightweight FastAPI application exposing:
  - `POST /api/analyze`: Runs the full pipeline and returns the explainability payload.
  - `GET /api/health`: System health and engine status.
- `requirements.txt`: Python package dependencies.

---

## How to Run the Python API
```bash
# 1. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Configure environment variables in .env
# TAVILY_API_KEY=tvly-...
# ASI_CLOUD_KEY=...

# 4. Start the FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## How the Frontend Communicates with the Backend
- The React frontend sends queries to `/api/analyze`.
- The Node gateway checks for the running Python service at `http://127.0.0.1:8000` (or the configured `PYTHON_BACKEND_URL`).
- If the Python server is running, the request is executed directly by the Python process with native `hyperon` MeTTa bindings.
- If running in headless preview or cloud container where Python dependencies are offline, the server-side engine executes the exact same Tavily + ASI Cloud / Gemini + MeTTa symbolic logic with your server-side keys.
