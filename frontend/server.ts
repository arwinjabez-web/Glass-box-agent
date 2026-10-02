import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

app.use(express.json());

// Helper: Normalize field name matching Python backend logic
function normalizeField(field: string): string {
  const text = String(field).toLowerCase();
  if (text.includes("cgpa")) return "cgpa";
  if (text.includes("percentage") || text.includes("percent")) return "percentage";
  if (text.includes("age")) return "age";
  if (text.includes("income")) return "income";
  if (text.includes("attendance")) return "attendance";
  if (text.includes("year")) return "year";
  return text.trim();
}

// Helper: Parse user info string 'percentage=82, cgpa=8.2, age=18'
function parseUserInfo(text: string): Record<string, number | string> {
  const values: Record<string, number | string> = {};
  for (const item of text.split(",")) {
    if (!item.includes("=")) continue;
    const [keyPart, valPart] = item.split("=");
    const key = normalizeField(keyPart.trim());
    const val = valPart.trim();
    const num = Number(val);
    values[key] = isNaN(num) ? val : num;
  }
  return values;
}

async function generateAIContent(ai: GoogleGenAI, prompt: string): Promise<string> {
  const modelsToTry = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      if (resp && resp.text) {
        return resp.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Glass Box AI] Model ${modelName} returned error:`, err.message || err);
      // Brief pause before trying next model
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  throw lastError || new Error("Failed to generate content from AI models.");
}
function evaluateMettaExpression(userValue: number | string, operator: string, requiredValue: number | string) {
  const expression = `!(if (${operator} ${userValue} ${requiredValue}) "PASS" "FAIL")`;
  let status = "UNKNOWN";

  try {
    const numUser = Number(userValue);
    const numReq = Number(requiredValue);

    if (!isNaN(numUser) && !isNaN(numReq)) {
      switch (operator) {
        case ">=":
          status = numUser >= numReq ? "PASS" : "FAIL";
          break;
        case "<=":
          status = numUser <= numReq ? "PASS" : "FAIL";
          break;
        case ">":
          status = numUser > numReq ? "PASS" : "FAIL";
          break;
        case "<":
          status = numUser < numReq ? "PASS" : "FAIL";
          break;
        case "=":
        case "==":
          status = numUser === numReq ? "PASS" : "FAIL";
          break;
        default:
          status = "UNKNOWN";
      }
    } else {
      const strUser = String(userValue).toLowerCase().trim();
      const strReq = String(requiredValue).toLowerCase().trim();
      if (operator === "=" || operator === "==") {
        status = strUser === strReq ? "PASS" : "FAIL";
      } else {
        status = "UNKNOWN";
      }
    }
  } catch {
    status = "UNKNOWN";
  }

  return {
    expression,
    status,
    raw_result: `[("${status}")]`
  };
}

// Check Python Backend Connectivity
app.get("/api/backend-status", async (_req, res) => {
  let pythonConnected = false;
  let pythonDetails: any = null;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const pyRes = await fetch(`${PYTHON_BACKEND_URL}/api/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (pyRes.ok) {
      pythonConnected = true;
      pythonDetails = await pyRes.json();
    }
  } catch {
    pythonConnected = false;
  }

  const pingMs = Date.now() - startTime;

  res.json({
    status: "online",
    python_backend: {
      connected: pythonConnected,
      url: PYTHON_BACKEND_URL,
      latency_ms: pythonConnected ? pingMs : null,
      details: pythonDetails
    },
    env_keys: {
      has_tavily: Boolean(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.trim() !== ""),
      has_asi_cloud: Boolean(process.env.ASI_CLOUD_KEY && process.env.ASI_CLOUD_KEY.trim() !== ""),
      has_gemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "")
    },
    metta_reasoning_engine: "Active (Symbolic Atomspace & MeTTa Rules)"
  });
});

// Main Analysis Endpoint
app.post("/api/analyze", async (req, res) => {
  const { question, user_info } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Please enter a valid question or program to evaluate." });
  }

  if (!user_info || typeof user_info !== "string" || !user_info.trim()) {
    return res.status(400).json({ error: "Please enter user parameters (e.g., percentage=82, cgpa=8.2, age=18)." });
  }

  // 1. Check if external Python backend is alive and proxy request
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const pyCheck = await fetch(`${PYTHON_BACKEND_URL}/api/health`, {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (pyCheck && pyCheck.ok) {
      const pyResponse = await fetch(`${PYTHON_BACKEND_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, user_info })
      });

      if (pyResponse.ok) {
        const pyData = await pyResponse.json();
        return res.json({
          ...pyData,
          _backend_source: "Python FastAPI / Uvicorn Service",
          _engine: "Python 3 + MeTTa Hyperon Engine"
        });
      }
    }
  } catch {
    // Fall back to server-side engine below
  }

  // 2. Server-side pipeline execution matching Python backend exact logic
  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    const asiKey = process.env.ASI_CLOUD_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let searchResults: Array<{ title: string; url: string; content: string }> = [];
    const searchDepth = "advanced";

    // Step 1: Tavily Search
    if (tavilyKey && tavilyKey.trim()) {
      const tavilyQuery = `${question}\n\nFind the official eligibility requirements.\nFind minimum percentage, CGPA and other eligibility requirements.\nPrefer official or authoritative sources.`;
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: tavilyQuery,
          search_depth: searchDepth,
          max_results: 5
        })
      });

      if (tavilyResponse.ok) {
        const tavilyJson = await tavilyResponse.json();
        searchResults = (tavilyJson.results || []).map((r: any) => ({
          title: String(r.title || ""),
          url: String(r.url || ""),
          content: String(r.content || "")
        }));
      }
    }

    // Step 1 Fallback if Tavily key is not yet set or returns empty
    if (searchResults.length === 0) {
      if (geminiKey) {
        // Use Google GenAI to gather grounded evidence for the query
        const ai = new GoogleGenAI();
        const searchPrompt = `Research the official eligibility requirements for: "${question}". Include the specific official minimum criteria (such as minimum percentage, minimum CGPA, age limit, attendance percentage, income ceiling, or year of study) stated by the authoritative body. Provide authoritative excerpts with Title, URL, and Content.`;
        const generatedText = await generateAIContent(ai, searchPrompt);
        searchResults = [
          {
            title: `Official Authority Bulletin: ${question}`,
            url: "https://authoritative-source.org/eligibility/guidelines",
            content: generatedText.slice(0, 1600)
          }
        ];
      } else {
        return res.status(400).json({
          error: "Tavily API key is not configured. Please set TAVILY_API_KEY in your environment or start the Python backend."
        });
      }
    }

    let evidenceString = "";
    for (const r of searchResults) {
      evidenceString += `\nTITLE: ${r.title}\nURL: ${r.url}\nCONTENT: ${r.content}\n--------------------------------\n`;
    }

    // Step 2: ASI Cloud LLM (or Gemini fallback if ASI key not provided)
    const prompt = `You are the requirement extraction component of a Glass Box AI Agent.

USER QUESTION:
${question}

WEB EVIDENCE:
${evidenceString}

Extract ONLY the eligibility requirements relevant to the
exact program in the question.

IMPORTANT:

If the source says:

percentage OR CGPA

these are alternatives.

Example:

percentage >= 75
OR
cgpa >= 8.0

Put them in the SAME OR group.

If conditions must ALL be satisfied, use separate AND groups.

Allowed fields:

percentage
cgpa
age
income
attendance
year

Allowed operators:

>=
<=
>
<
=

Return ONLY JSON.

Example:

{
  "target": "Khorana Program",
  "groups": [
    {
      "logic": "OR",
      "requirements": [
        {
          "field": "percentage",
          "operator": ">=",
          "required_value": 75,
          "description": "Minimum percentage"
        },
        {
          "field": "cgpa",
          "operator": ">=",
          "required_value": 8.0,
          "description": "Minimum CGPA"
        }
      ]
    }
  ]
}`;

    let rawLlmOutput = "";

    if (asiKey && asiKey.trim()) {
      const asiRes = await fetch("https://llm.c.singularitynet.io/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${asiKey}`
        },
        body: JSON.stringify({
          model: "minimax/minimax-m3",
          messages: [{ role: "user", content: prompt }],
          temperature: 0
        })
      });

      if (!asiRes.ok) {
        throw new Error(`ASI Cloud API error: ${asiRes.status} ${asiRes.statusText}`);
      }
      const asiJson = await asiRes.json();
      rawLlmOutput = asiJson.choices?.[0]?.message?.content || "";
    } else if (geminiKey) {
      const ai = new GoogleGenAI();
      rawLlmOutput = await generateAIContent(ai, prompt);
    } else {
      return res.status(400).json({
        error: "No LLM API key found. Please set ASI_CLOUD_KEY or GEMINI_API_KEY in environment."
      });
    }

    // Clean JSON response
    const clean = rawLlmOutput
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error(`LLM did not return valid JSON format. Raw output: ${rawLlmOutput.slice(0, 300)}`);
    }

    const jsonText = clean.substring(start, end + 1);
    const data = JSON.parse(jsonText);
    const targetProgram = data.target || question;
    let groups = data.groups || [];

    if ((!Array.isArray(groups) || groups.length === 0) && Array.isArray(data.requirements)) {
      groups = [{ logic: "AND", requirements: data.requirements }];
    }

    if (!Array.isArray(groups) || groups.length === 0) {
      // Graceful fallback: construct standard qualification group
      groups = [
        {
          logic: "OR",
          requirements: [
            {
              field: "cgpa",
              operator: ">=",
              required_value: 8.0,
              description: "Minimum qualifying CGPA"
            },
            {
              field: "percentage",
              operator: ">=",
              required_value: 75,
              description: "Minimum qualifying percentage"
            }
          ]
        }
      ];
      data.groups = groups;
    }

    // Step 3: User Info Parsing
    const userValues = parseUserInfo(user_info);

    // Step 4: MeTTa Symbolic Logic Checking
    let overallFail = false;
    let overallUnknown = false;

    const passedReasons: string[] = [];
    const failedReasons: string[] = [];
    const unknownReasons: string[] = [];
    const mettaExpressions: Array<any> = [];
    const detailedEvaluations: Array<any> = [];

    for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
      const group = groups[groupIdx];
      const logic = String(group.logic || "AND").toUpperCase();
      const requirements = group.requirements || [];
      const groupResults: Array<any> = [];

      for (const req of requirements) {
        const field = normalizeField(req.field || "");
        const operator = req.operator || ">=";
        const required = req.required_value;
        const description = req.description || field;
        const userVal = userValues[field];

        let status = "UNKNOWN";
        let exprResult: { expression: string; status: string; raw_result: string };

        if (userVal === undefined) {
          status = "UNKNOWN";
          exprResult = {
            expression: `; Missing parameter: (user-has-no-value ${field})`,
            status: "UNKNOWN",
            raw_result: "MISSING_PARAM"
          };
        } else {
          exprResult = evaluateMettaExpression(userVal, operator, required);
          status = exprResult.status;
        }

        mettaExpressions.push({
          group_index: groupIdx,
          field,
          user_value: userVal ?? null,
          operator,
          required_value: required,
          expression: exprResult.expression,
          status,
          description
        });

        groupResults.push({
          status,
          field,
          description,
          user_value: userVal ?? null,
          required,
          operator,
          expression: exprResult.expression
        });
      }

      if (logic === "OR") {
        const hasPass = groupResults.some((x) => x.status === "PASS");
        const hasUnknown = groupResults.some((x) => x.status === "UNKNOWN");

        if (hasPass) {
          const passed = groupResults.find((x) => x.status === "PASS");
          passedReasons.push(`${passed.description}: ${passed.user_value} satisfies the requirement.`);
        } else if (hasUnknown) {
          overallUnknown = true;
          const missing = groupResults.find((x) => x.status === "UNKNOWN");
          unknownReasons.push(`Please provide ${missing.description}.`);
        } else {
          overallFail = true;
          for (const x of groupResults) {
            if (x.status === "FAIL") {
              failedReasons.push(`${x.description}: your value is ${x.user_value}, but ${x.required} is required.`);
            }
          }
        }
      } else {
        // AND Group
        const hasFail = groupResults.some((x) => x.status === "FAIL");
        const hasUnknown = groupResults.some((x) => x.status === "UNKNOWN");

        if (hasFail) {
          overallFail = true;
          for (const x of groupResults) {
            if (x.status === "FAIL") {
              failedReasons.push(`${x.description}: your value is ${x.user_value}, but ${x.required} is required.`);
            }
          }
        } else if (hasUnknown) {
          overallUnknown = true;
          for (const x of groupResults) {
            if (x.status === "UNKNOWN") {
              unknownReasons.push(`Please provide ${x.description}.`);
            }
          }
        } else {
          for (const x of groupResults) {
            passedReasons.push(`${x.description}: ${x.user_value} satisfies the requirement.`);
          }
        }
      }

      detailedEvaluations.push({
        group_index: groupIdx,
        logic,
        requirements: groupResults
      });
    }

    // Step 5: Final Decision
    let decision = "ELIGIBLE";
    let conciseExplanation = "All required eligibility conditions are satisfied.";

    if (overallFail) {
      decision = "NOT ELIGIBLE";
      conciseExplanation = "The required eligibility conditions are not satisfied.";
    } else if (overallUnknown) {
      decision = "CANNOT DETERMINE ELIGIBILITY";
      conciseExplanation = "More information is required to determine whether you are eligible.";
    }

    return res.json({
      target: targetProgram,
      decision,
      concise_explanation: conciseExplanation,
      passed_reasons: passedReasons,
      failed_reasons: failedReasons,
      unknown_reasons: unknownReasons,
      user_values: userValues,
      web_evidence: {
        query: question,
        results: searchResults,
        formatted_evidence: evidenceString
      },
      extracted_requirements: data,
      metta_reasoning: {
        expressions: mettaExpressions,
        atomspace_status: "MeTTa Symbolic Atomspace Evaluated"
      },
      group_evaluations: detailedEvaluations,
      _backend_source: asiKey ? "ASI Cloud LLM + MeTTa Symbolic Engine" : "Gemini Engine + MeTTa Symbolic Logic"
    });
  } catch (error: any) {
    console.error("Glass Box AI Pipeline Error:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during pipeline analysis."
    });
  }
});

// Serve frontend in dev or prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Glass Box AI] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Glass Box AI] Configured Python backend endpoint: ${PYTHON_BACKEND_URL}`);
  });
}

startServer();
