import sys
import os
import traceback

sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))
from main import auto_setup_db

try:
    auto_setup_db()
    print("Database setup complete.")
except Exception as e:
    print(repr(e))
    traceback.print_exc()
