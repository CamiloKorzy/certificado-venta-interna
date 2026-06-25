import json

path = r"C:\Users\Usuario\.gemini\antigravity\brain\b7147187-79e9-4819-aa74-c15ba564d3f0\.system_generated\logs\transcript.jsonl"

def search():
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            try:
                data = json.loads(line)
                # Look for USER_INPUT steps
                if data.get("type") == "USER_INPUT":
                    content = data.get("content", "")
                    if "supabase" in content.lower() or "tabla" in content.lower() or "conex" in content.lower() or "enriquez" in content.lower():
                        print(f"Index {data.get('step_index')}: {content}")
            except Exception as e:
                pass

if __name__ == '__main__':
    search()
