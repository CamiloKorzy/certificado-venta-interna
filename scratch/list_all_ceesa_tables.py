import psycopg2

DB_HOST = "infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def list_tables():
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND (table_name LIKE 'ceesa_cee%' OR table_name LIKE '%equipo%' OR table_name LIKE '%certificado%')
        ORDER BY table_name
    """)
    rows = cur.fetchall()
    print("Tables matching search pattern:")
    for r in rows:
        print("  ", r[0])
    cur.close()
    conn.close()

if __name__ == '__main__':
    list_tables()
