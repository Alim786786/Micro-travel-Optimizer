from dotenv import load_dotenv
import os
from litellm import completion
from typing import List, Dict
import time
from dotenv import load_dotenv
import sys
import json

load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')

if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

os.environ['OPENAI_API_KEY'] = api_key

def generate_response(messages: List[Dict]) -> str:
    """Call LLM to get response"""
    response = completion(
        model="openai/gpt-4",
        messages=messages,
        max_tokens=1024
    )
    time.sleep(1) # Add a 1-second delay after the API call
    return str(response.choices[0].message.content)

def extract_code_block(response: str) -> str:
    """Extract first fenced code block; if none, return whole response."""
    if "```" not in response:
        return response.strip()

    parts = response.split("```", 2)
    # parts: [before, maybe "python\n<code>" or "<code>", after...]
    code_block = parts[1].strip()

    # Remove a leading language tag like "python\n"
    if code_block.lower().startswith("python"):
        code_block = code_block[len("python"):].lstrip("\n\r")

    return code_block.strip()


def develop_custom_function():
    # Get user input for function description
    print("\nWhat kind of function would you like to create?")
    print("Example: 'A function that calculates the factorial of a number'")
    function_description = input("Your description: ").strip()

    # Initialize conversation with system prompt
    messages = [
        {"role": "system", "content": "You are a Python expert helping to develop a function."}
    ]

    # First prompt - Basic function
    messages.append({
        "role": "user",
        "content": (
            f"Write a Python function that {function_description}. "
            "Output the function in a ```python code block```."
        ),
    })
    initial_function = extract_code_block(generate_response(messages))

    print("\n=== Initial Function ===")
    print(initial_function)

    # Force assistant's last output to be only the code (no commentary)
    messages.append({"role": "assistant", "content": f"```python\n{initial_function}\n```"})

    # Second prompt - Add documentation
    messages.append({
        "role": "user",
        "content": (
            "Add comprehensive documentation to this function, including description, parameters, "
            "return value, examples, and edge cases. Output the function in a ```python code block```."
        ),
    })
    documented_function = extract_code_block(generate_response(messages))

    print("\n=== Documented Function ===")
    print(documented_function)

    messages.append({"role": "assistant", "content": f"```python\n{documented_function}\n```"})

    # Third prompt - Add test cases
    messages.append({
        "role": "user",
        "content": (
            "Add unittest test cases for this function, including tests for basic functionality, "
            "edge cases, error cases, and various input scenarios. Output the code in a ```python code block```."
        ),
    })
    test_cases = extract_code_block(generate_response(messages))

    print("\n=== Test Cases ===")
    print(test_cases)

    # No file writing — just return values if you want to use them programmatically
    return documented_function, test_cases


if __name__ == "__main__":
    function_code, tests = develop_custom_function()
