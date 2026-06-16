import psycopg2

SUPABASE_DB_URL = "postgresql://postgres.csvgvzhokgbuxmlqumur:Lula$$2014$$@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
conn = psycopg2.connect(SUPABASE_DB_URL)
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='cert_ajustes_excel'")
print([row[0] for row in cur.fetchall()])
