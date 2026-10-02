from hyperon import MeTTa

metta = MeTTa()

def check_eligibility(user_value, required_value):
    query = f'!(if (>= {user_value} {required_value}) "PASS" "FAIL")'

    result = metta.run(query)

    if result:
        decision = str(result[0])
    else:
        decision = "UNKNOWN"

    print("\n========== METTA REASONING ==========")

    print(f"User value     : {user_value}")
    print(f"Required value : {required_value}")
    print(f"Rule           : {user_value} >= {required_value}")

    if "PASS" in decision:
        print("Result         : PASS")
        print("Explanation    : The user's value satisfies the requirement.")
    else:
        print("Result         : FAIL")
        print("Explanation    : The user's value does not satisfy the requirement.")

    print("=====================================\n")

    return decision


# Test
check_eligibility(82, 75)
check_eligibility(68, 75)