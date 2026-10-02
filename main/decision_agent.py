import os
import json
import re

from dotenv import load_dotenv
from tavily import TavilyClient
from openai import OpenAI
from hyperon import MeTTa


# ============================================================
# SETUP
# ============================================================

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
ASI_CLOUD_KEY = os.getenv("ASI_CLOUD_KEY")

if not TAVILY_API_KEY:
    print("ERROR: TAVILY_API_KEY not found in .env")
    input("\nPress Enter to close...")
    raise SystemExit

if not ASI_CLOUD_KEY:
    print("ERROR: ASI_CLOUD_KEY not found in .env")
    input("\nPress Enter to close...")
    raise SystemExit


try:
    tavily = TavilyClient(
        api_key=TAVILY_API_KEY
    )

    llm = OpenAI(
        api_key=ASI_CLOUD_KEY,
        base_url="https://llm.c.singularitynet.io/v1"
    )

    metta = MeTTa()

except Exception as e:
    print("\nSETUP ERROR:")
    print(e)
    input("\nPress Enter to close...")
    raise SystemExit


# ============================================================
# INPUT
# ============================================================

print("\n==========================================")
print("        GLASS BOX AI AGENT")
print("==========================================")

question = input(
    "\nWhat do you want to check?\n> "
).strip()

user_info = input(
    "\nEnter your information "
    "(example: percentage=82, cgpa=8.2, age=18):\n> "
).strip()


# ============================================================
# TAVILY
# ============================================================



try:

    search_result = tavily.search(
        query=f"""
        {question}

        Find the official eligibility requirements.
        Find minimum percentage, CGPA and other eligibility
        requirements.
        Prefer official or authoritative sources.
        """,
        search_depth="advanced",
        max_results=5
    )

except Exception as e:

    print("\nTAVILY ERROR:")
    print(e)
    input("\nPress Enter to close...")
    raise SystemExit


results = search_result.get("results", [])

if not results:

    print("\nTavily returned no results.")
    input("\nPress Enter to close...")
    raise SystemExit



# ============================================================
# BUILD EVIDENCE
# ============================================================

evidence = ""

for result in results:

    evidence += (
        "\nTITLE: "
        + str(result.get("title", ""))
        + "\nURL: "
        + str(result.get("url", ""))
        + "\nCONTENT: "
        + str(result.get("content", ""))
        + "\n--------------------------------\n"
    )


# ============================================================
# ASI CLOUD
# ============================================================



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


try:

    response = llm.chat.completions.create(
        model="minimax/minimax-m3",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

except Exception as e:

    print("\nASI CLOUD ERROR:")
    print(e)
    input("\nPress Enter to close...")
    raise SystemExit


raw = response.choices[0].message.content



# ============================================================
# SHOW WHAT ASI ACTUALLY RETURNED
# ============================================================



if not raw:

    print("\nASI returned an empty response.")
    input("\nPress Enter to close...")
    raise SystemExit



# Remove markdown fences
clean = re.sub(
    r"```json",
    "",
    raw,
    flags=re.IGNORECASE
)

clean = re.sub(
    r"```",
    "",
    clean
)

clean = clean.strip()


start = clean.find("{")
end = clean.rfind("}")


if start == -1 or end == -1:

    print("\nASI did not return JSON.")

    print("\nWhat ASI returned:")
    print(raw)

    input("\nPress Enter to close...")
    raise SystemExit


json_text = clean[
    start:end + 1
]


try:

    data = json.loads(
        json_text
    )

except Exception as e:

    print("\nJSON ERROR:")
    print(e)

    print("\nWhat ASI returned:")
    print(raw)

    input("\nPress Enter to close...")
    raise SystemExit


groups = data.get(
    "groups",
    []
)


if not groups:



    print("\nParsed response:")
    print(
        json.dumps(
            data,
            indent=2
        )
    )

    input("\nPress Enter to close...")
    raise SystemExit




# ============================================================
# USER INFORMATION
# ============================================================

def normalize_field(field):

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


def parse_user_info(text):

    values = {}

    for item in text.split(","):

        if "=" not in item:
            continue

        key, value = item.split(
            "=",
            1
        )

        key = normalize_field(
            key.strip()
        )

        value = value.strip()

        try:
            values[key] = float(value)

        except ValueError:
            values[key] = value

    return values


user_values = parse_user_info(
    user_info
)


# ============================================================
# METTA
# ============================================================

def metta_check(
    user_value,
    operator,
    required_value
):

    try:

        expression = (
            f'!(if '
            f'({operator} {user_value} {required_value}) '
            f'"PASS" "FAIL")'
        )

        result = metta.run(
            expression
        )

        text = str(result)

        if "PASS" in text:
            return "PASS"

        if "FAIL" in text:
            return "FAIL"

        return "UNKNOWN"

    except Exception as e:

        print("\nMeTTa ERROR:")
        print(e)

        return "UNKNOWN"


# ============================================================
# EVALUATE
# ============================================================

print(" Running MeTTa reasoning...")


overall_fail = False
overall_unknown = False

passed_reasons = []
failed_reasons = []
unknown_reasons = []


for group in groups:

    logic = str(
        group.get(
            "logic",
            "AND"
        )
    ).upper()

    requirements = group.get(
        "requirements",
        []
    )


    group_results = []


    for requirement in requirements:

        field = normalize_field(
            requirement.get(
                "field",
                ""
            )
        )

        operator = requirement.get(
            "operator",
            ">="
        )

        required = requirement.get(
            "required_value"
        )

        description = requirement.get(
            "description",
            field
        )

        user_value = user_values.get(
            field
        )


        if user_value is None:

            status = "UNKNOWN"

        else:

            status = metta_check(
                user_value,
                operator,
                required
            )


        group_results.append(
            {
                "status": status,
                "field": field,
                "description": description,
                "user_value": user_value,
                "required": required
            }
        )


    # ========================================================
    # OR
    # ========================================================

    if logic == "OR":

        if any(
            x["status"] == "PASS"
            for x in group_results
        ):

            passed = next(
                x for x in group_results
                if x["status"] == "PASS"
            )

            passed_reasons.append(
                f'{passed["description"]}: '
                f'{passed["user_value"]} satisfies '
                f'the requirement.'
            )

        elif any(
            x["status"] == "UNKNOWN"
            for x in group_results
        ):

            overall_unknown = True

            missing = next(
                x for x in group_results
                if x["status"] == "UNKNOWN"
            )

            unknown_reasons.append(
                f'Please provide {missing["description"]}.'
            )

        else:

            overall_fail = True

            for x in group_results:

                if x["status"] == "FAIL":

                    failed_reasons.append(
                        f'{x["description"]}: '
                        f'your value is {x["user_value"]}, '
                        f'but {x["required"]} is required.'
                    )


    # ========================================================
    # AND
    # ========================================================

    else:

        if any(
            x["status"] == "FAIL"
            for x in group_results
        ):

            overall_fail = True

            for x in group_results:

                if x["status"] == "FAIL":

                    failed_reasons.append(
                        f'{x["description"]}: '
                        f'your value is {x["user_value"]}, '
                        f'but {x["required"]} is required.'
                    )

        elif any(
            x["status"] == "UNKNOWN"
            for x in group_results
        ):

            overall_unknown = True

            for x in group_results:

                if x["status"] == "UNKNOWN":

                    unknown_reasons.append(
                        f'Please provide {x["description"]}.'
                    )

        else:

            for x in group_results:

                passed_reasons.append(
                    f'{x["description"]}: '
                    f'{x["user_value"]} satisfies '
                    f'the requirement.'
                )


# ============================================================
# FINAL RESULT
# ============================================================

print("\n==========================================")
print("              FINAL RESULT")
print("==========================================\n")


if overall_fail:

    print("✗ NOT ELIGIBLE")
    print()
    print("You are not eligible because:")

    for reason in failed_reasons[:3]:

        print("•", reason)

    print()
    print(
        "The required eligibility conditions "
        "are not satisfied."
    )


elif overall_unknown:

    print("? CANNOT DETERMINE ELIGIBILITY")
    print()
    print(
        "I need more information to determine "
        "whether you are eligible."
    )

    for reason in unknown_reasons[:3]:

        print("•", reason)


else:

    print("✓ ELIGIBLE")
    print()
    print("You are eligible because:")

    for reason in passed_reasons[:3]:

        print("•", reason)

    print()
    print(
        "All required eligibility conditions "
        "are satisfied."
    )


print()
print("==========================================")