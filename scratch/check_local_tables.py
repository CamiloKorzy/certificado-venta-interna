import psycopg2

def check():
    conn_str = "postgresql://postgres.csvgvzhokgbuxmlqumur:Lula$$2014$$@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
    try:
        conn = psycopg2.connect(conn_str)
        print("Connected to local Supabase DB!")
        cur = conn.cursor()
        
        # List all tables in public schema
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = [row[0] for row in cur.fetchall()]
        print("Local tables:", tables)
        
        for t in tables:
            if "transporte" in t or "tranporte" in t:
                print(f"\n=== Columns for local table: {t} ===")
                cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='{t}'")
                for col in cur.fetchall():
                    print(f"  {col[0]}: {col[1]}")
                    
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
