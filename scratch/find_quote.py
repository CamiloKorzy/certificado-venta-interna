with open('backend/main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
    in_string = False
    for i, line in enumerate(lines):
        c = line.count('"""')
        if c % 2 != 0:
            in_string = not in_string
            print(f"Line {i+1}: in_string={in_string}")
