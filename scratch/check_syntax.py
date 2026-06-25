import tokenize
from io import BytesIO

with open('backend/main.py', 'rb') as f:
    try:
        tokens = list(tokenize.tokenize(f.readline))
    except tokenize.TokenError as e:
        print("TokenError:", e)
