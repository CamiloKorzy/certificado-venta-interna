import sys
import os
import requests
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import get_aurora

try:
    conn = get_aurora()
    cur = conn.cursor()
    cur.execute("SELECT centrocostoid, COUNT(*) FROM ceesa_bscentrocosto GROUP BY centrocostoid HAVING COUNT(*) > 1")
    dups = cur.fetchall()
    print("Duplicates:", dups)
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
