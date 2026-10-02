from hyperon import MeTTa

metta = MeTTa()

# Load the MeTTa rules
with open("reasoning.metta", "r") as file:
    rules = file.read()

metta.run(rules)

# Enter your attendance here
a=int(input("Enter your attendance percentage: "))

# Ask MeTTa to make the decision
result = metta.run(f"!(check-attendance {a})")

print("GLASS BOX AI AGENT")
print("------------------")
print(f"Attendance = {a}%")
print()
print("Decision:")
print(result)