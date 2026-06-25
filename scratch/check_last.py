with open('backend/main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    last = [(i+1, l) for i, l in enumerate(lines) if '"""' in l]
    for i, l in last:
        print(f"Line {i}: {l.strip()}")
