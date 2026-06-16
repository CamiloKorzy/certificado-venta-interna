import psycopg2
import urllib.parse

password = "Lula$$2014$$"
encoded_password = urllib.parse.quote_plus(password)
url = f"postgresql://postgres.csvgvzhokgbuxmlqumur:{encoded_password}@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(url)
    print("OK")
    conn.close()
except Exception as e:
    print("Error:", e)
