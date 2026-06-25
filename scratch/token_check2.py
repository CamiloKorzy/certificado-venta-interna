import tokenize
from io import BytesIO

with open('backend/main.py', 'rb') as f:
    try:
        for t in tokenize.tokenize(f.readline):
            if t.type == tokenize.STRING and '"""' in t.string:
                print(f"Triple-quote string from {t.start} to {t.end}")
    except tokenize.TokenError as e:
        print("TokenError:", e)
