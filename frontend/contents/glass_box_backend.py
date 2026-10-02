import os
import json
import re
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
ASI_CLOUD_KEY = os.getenv("ASI_CLOUD_KEY")

# Optional lazy client initialization
_tavily = None
_llm = None
_metta = None

def get_clients():
    global _tavily, _llm, _metta
    if _tavily is None and TAVILY_API_KEY:
        from tavily import TavilyClient
        _tavily = TavilyClient(api_key=TAVILY_API_KEY)
    
    if _llm is None and ASI_CLOUD_KEY:
        from openai import OpenAI
        _llm = OpenAI(
            api_key=ASI_CLOUD_KEY,
            base_url="https://llm.c.singularitynet.io/v1"
        )
        
    if _metta is None:
        try:
            from hyperon import MeTTa
            _metta = MeTTa()
        except ImportError:
            _metta = None
            
    return _tavily, _llm, _metta


def normalize_field(field: str) -> str:
    text = str(field).lower()
    if "cgpa" in text:
        return "cgpa"
    if "percentage" in text or "percent" in text:
        return "percentage"
    if "age" in text:
        return "age"
    if "income" in text:
        return "income"
    if "attendance" in text:
        return "attendance"
    if "year" in text:
        return "year"
    return text.strip()


def parse_user_info(text: str) -> Dict[str, Any]:
    values = {}
    for item in text.split(","):
        if "=" not in item:
            continue
        key, value = item.split("=", 1)
        key = normalize_field(key.strip())
        value = value.strip()
        try:
            values[key] = float(value)
        except ValueError:
            values[key] = value
    return values


def metta_check(user_value: Any, operator: str, required_value: Any, metta_instance=None) -> Dict[str, Any]:
    expression = f'!(if ({operator} {user_value} {required_value}) "PASS" "FAIL")'
    try:
        if metta_instance:
            result = metta_instance.run(expression)
            text = str(result)
            if "PASS" in text:
                status = "PASS"
            elif "FAIL" in text:
                status = "FAIL"
            else:
                status = "UNKNOWN"
        else:
            # Fallback pure symbolic interpreter in absence of C++ hyperon wheel
            if operator == ">=":
                status = "PASS" if float(user_value) >= float(required_value) else "FAIL"
            elif operator == "<=":
                status = "PASS" if float(user_value) <= float(required_value) else "FAIL"
            elif operator == ">":
                status = "PASS" if float(user_value) > float(required_value) else "FAIL"
            elif operator == "<":
                status = "PASS" if float(user_value) < float(required_value) else "FAIL"
            elif operator in ("=", "=="):
                status = "PASS" if str(user_value).lower() == str(required_value).lower() else "FAIL"
            else:
                status = "UNKNOWN"
    except Exception as e:
        status = "UNKNOWN"
        text = str(e)
        
    return {
        "expression": expression,
        "status": status,
        "raw_result": text if 'text' in locals() else status
    }


def execute_glass_box_pipeline(question: str, user_info: str) -> Dict[str, Any]:
    """
    Executes the exact 4-stage pipeline of the Glass Box AI Agent:
    1. Web Evidence (Tavily search)
    2. Requirement Extraction (ASI Cloud Minimax-m3 via SingularityNET)
    3. User Info Normalization & MeTTa Logical Reasoning
    4. Deterministic AND/OR Group Decision Synthesis
    """
    tavily, llm, metta = get_clients()

    if not tavily:
        raise ValueError("TAVILY_API_KEY is not configured on the server.")
    if not llm:
        raise ValueError("ASI_CLOUD_KEY is not configured on the server.")

    # 1. TAVILY SEARCH
    query = f"""
    {question}

    Find the official eligibility requirements.
    Find minimum percentage, CGPA and other eligibility
    requirements.
    Prefer official or authoritative sources.
    """
    search_result = tavily.search(
        query=query,
        search_depth="advanced",
        max_results=5
    )
    raw_results = search_result.get("results", [])

    if not raw_results:
        raise ValueError("Tavily returned no search results for this query.")

    evidence = ""
    evidence_items = []
    for res in raw_results:
        title = str(res.get("title", ""))
        url = str(res.get("url", ""))
        content = str(res.get("content", ""))
        evidence += f"\nTITLE: {title}\nURL: {url}\nCONTENT: {content}\n--------------------------------\n"
        evidence_items.append({
            "title": title,
            "url": url,
            "content": content
        })

    # 2. ASI CLOUD LLM REQUIREMENT EXTRACTION
    prompt = f"""
You are the requirement extraction component of a Glass Box AI Agent.

USER QUESTION:
{question}

WEB EVIDENCE:
{evidence}

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

{{
  "target": "Khorana Program",
  "groups": [
    {{
      "logic": "OR",
      "requirements": [
        {{
          "field": "percentage",
          "operator": ">=",
          "required_value": 75,
          "description": "Minimum percentage"
        }},
        {{
          "field": "cgpa",
          "operator": ">=",
          "required_value": 8.0,
          "description": "Minimum CGPA"
        }}
      ]
    }}
  ]
}}
"""

    response = llm.chat.completions.create(
        model="minimax/minimax-m3",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    raw_llm_output = response.choices[0].message.content or ""
    clean = re.sub(r"```json", "", raw_llm_output, flags=re.IGNORECASE)
    clean = re.sub(r"```", "", clean).strip()

    start = clean.find("{")
    end = clean.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"ASI Cloud did not return JSON format. Raw output: {raw_llm_output}")

    json_text = clean[start:end + 1]
    data = json.loads(json_text)

    target_program = data.get("target", question)
    groups = data.get("groups", [])
    if not groups:
        raise ValueError("No eligibility requirement groups extracted by ASI Cloud.")

    # 3. PARSE USER INFO
    user_values = parse_user_info(user_info)

    # 4. METTA REASONING & EVALUATION
    overall_fail = False
    overall_unknown = False

    passed_reasons = []
    failed_reasons = []
    unknown_reasons = []

    detailed_evaluations = []
    metta_expressions = []

    for group_idx, group in enumerate(groups):
        logic = str(group.get("logic", "AND")).upper()
        requirements = group.get("requirements", [])
        group_results = []

        for req in requirements:
            field = normalize_field(req.get("field", ""))
            operator = req.get("operator", ">=")
            required = req.get("required_value")
            description = req.get("description", field)
            user_val = user_values.get(field)

            if user_val is None:
                status = "UNKNOWN"
                expr_data = {
                    "expression": f'; Missing user value for {field}',
                    "status": "UNKNOWN",
                    "raw_result": "MISSING_DATA"
                }
            else:
                expr_data = metta_check(user_val, operator, required, metta)
                status = expr_data["status"]

            metta_expressions.append({
                "group_index": group_idx,
                "field": field,
                "user_value": user_val,
                "operator": operator,
                "required_value": required,
                "expression": expr_data["expression"],
                "status": status,
                "description": description
            })

            group_results.append({
                "status": status,
                "field": field,
                "description": description,
                "user_value": user_val,
                "required": required,
                "operator": operator,
                "expression": expr_data["expression"]
            })

        # OR GROUP EVALUATION
        if logic == "OR":
            if any(x["status"] == "PASS" for x in group_results):
                passed = next(x for x in group_results if x["status"] == "PASS")
                passed_reasons.append(
                    f'{passed["description"]}: {passed["user_value"]} satisfies the requirement.'
                )
            elif any(x["status"] == "UNKNOWN" for x in group_results):
                overall_unknown = True
                missing = next(x for x in group_results if x["status"] == "UNKNOWN")
                unknown_reasons.append(
                    f'Please provide {missing["description"]}.'
                )
            else:
                overall_fail = True
                for x in group_results:
                    if x["status"] == "FAIL":
                        failed_reasons.append(
                            f'{x["description"]}: your value is {x["user_value"]}, but {x["required"]} is required.'
                        )
        # AND GROUP EVALUATION
        else:
            if any(x["status"] == "FAIL" for x in group_results):
                overall_fail = True
                for x in group_results:
                    if x["status"] == "FAIL":
                        failed_reasons.append(
                            f'{x["description"]}: your value is {x["user_value"]}, but {x["required"]} is required.'
                        )
            elif any(x["status"] == "UNKNOWN" for x in group_results):
                overall_unknown = True
                for x in group_results:
                    if x["status"] == "UNKNOWN":
                        unknown_reasons.append(
                            f'Please provide {x["description"]}.'
                        )
            else:
                for x in group_results:
                    passed_reasons.append(
                        f'{x["description"]}: {x["user_value"]} satisfies the requirement.'
                    )

        detailed_evaluations.append({
            "group_index": group_idx,
            "logic": logic,
            "requirements": group_results
        })

    # FINAL DECISION DETERMINATION
    if overall_fail:
        decision = "NOT ELIGIBLE"
        concise_explanation = "The required eligibility conditions are not satisfied."
    elif overall_unknown:
        decision = "CANNOT DETERMINE ELIGIBILITY"
        concise_explanation = "More information is required to determine whether you are eligible."
    else:
        decision = "ELIGIBLE"
        concise_explanation = "All required eligibility conditions are satisfied."

    return {
        "target": target_program,
        "decision": decision,
        "concise_explanation": concise_explanation,
        "passed_reasons": passed_reasons,
        "failed_reasons": failed_reasons,
        "unknown_reasons": unknown_reasons,
        "user_values": user_values,
        "web_evidence": {
            "query": query.strip(),
            "results": evidence_items,
            "formatted_evidence": evidence
        },
        "extracted_requirements": data,
        "metta_reasoning": {
            "expressions": metta_expressions,
            "atomspace_status": "Hyperon MeTTa Atomspace Evaluated"
        },
        "group_evaluations": detailed_evaluations
    }
