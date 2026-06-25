import tokenize
from io import BytesIO

with open('backend/main.py', 'rb') as f:
    tokens = []
    try:
        for t in tokenize.tokenize(f.readline):
            tokens.append(t)
    except tokenize.TokenError as e:
        print("TokenError:", e)
        print("Last tokens:")
        for t in tokens[-10:]:
            print(t)
