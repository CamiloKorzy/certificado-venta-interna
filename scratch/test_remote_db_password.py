import psycopg2

passwords = [
    "Lula$$2014",
    "Lula$$2014$$",
    "Ceesa2023*",
    "Lula2014",
    "Lula2014$$",
    "Lula2014$"
]

def test():
    host = "aws-0-us-east-2.pooler.supabase.com"
    user = "postgres.naxjzquhdzyoxtjataaw"
    for p in passwords:
        conn_str = f"postgresql://{user}:{p}@{host}:5432/postgres"
        print(f"Trying password '{p}' on {host}...")
        try:
            conn = psycopg2.connect(conn_str, connect_timeout=5)
            print(f"SUCCESS with password '{p}'!")
            cur = conn.cursor()
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
            rows = cur.fetchall()
            print("Tables:")
            for r in rows:
                print(f"  {r[0]}")
            cur.close()
            conn.close()
            return
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == '__main__':
    test()
