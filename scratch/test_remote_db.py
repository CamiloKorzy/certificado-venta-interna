import psycopg2

def test_conn():
    regions = [
        "aws-0-sa-east-1.pooler.supabase.com",
        "aws-1-sa-east-1.pooler.supabase.com",
        "aws-0-us-east-1.pooler.supabase.com",
        "aws-0-us-west-2.pooler.supabase.com"
    ]
    for r in regions:
        conn_str = f"postgresql://postgres.naxjzquhdzyoxtjataaw:Lula$$2014$$@{r}:5432/postgres"
        print(f"Connecting to remote Supabase DB via Pooler {r}...")
        try:
            conn = psycopg2.connect(conn_str, connect_timeout=5)
            print("Connection Success!")
            cur = conn.cursor()
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
            rows = cur.fetchall()
            print("Tables in public:")
            for row in rows:
                print(f"  {row[0]}")
            cur.close()
            conn.close()
            return
        except Exception as e:
            print(f"Failed to connect to {r}: {e}")

if __name__ == '__main__':
    test_conn()
