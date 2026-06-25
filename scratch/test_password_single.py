import psycopg2

def test_conn():
    host = "aws-0-us-east-2.pooler.supabase.com"
    user = "postgres.naxjzquhdzyoxtjataaw"
    p = "Lula$$2014"
    
    conn_str = f"postgresql://{user}:{p}@{host}:6543/postgres?sslmode=require"
    print(f"Connecting to {host}:6543 with user {user} and password {p}...")
    try:
        conn = psycopg2.connect(conn_str, connect_timeout=10)
        print("SUCCESSFULLY CONNECTED!")
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        rows = cur.fetchall()
        print("Tables in public:")
        for r in rows:
            print(f"  {r[0]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == '__main__':
    test_conn()
