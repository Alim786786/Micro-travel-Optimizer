import os
from dotenv import load_dotenv
import replicate

# Load API key from .env
load_dotenv()

# Run a text generation model
output = replicate.run(
    "meta/meta-llama-3-8b-instruct",
    input={"prompt": "Write a short motivational quote.", "max_tokens": 50}
)

# Join chunks into one string
result = "".join(output).strip()
print("AI says:", result)
