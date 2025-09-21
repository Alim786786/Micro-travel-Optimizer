import os
from dotenv import load_dotenv
import replicate

load_dotenv()
print("Token loaded?", bool(os.getenv("REPLICATE_API_TOKEN")))

# Run a text model directly
output = replicate.run(
    "meta/meta-llama-3-8b-instruct",
    input={"prompt": "Say hello in one short sentence.", "max_tokens": 50}
)

print("Model output:", output)