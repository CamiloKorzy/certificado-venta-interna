import psycopg2

def discover():
    regions = [
        "aws-0-sa-east-1.pooler.supabase.com",
        "aws-1-sa-east-1.pooler.supabase.com",
        "aws-0-us-east-1.pooler.supabase.com",
        "aws-0-us-west-2.pooler.supabase.com",
        "aws-0-us-east-2.pooler.supabase.com" # The summary said the database is in us-east-2 (Ohio)
    ]
    
    conn = None
    for r in regions:
        conn_str = f"postgresql://postgres.naxjzquhdzyoxtjataaw:Lula$$2014$$@{r}:5432/postgres"
        print(f"Connecting to remote Supabase DB via Pooler {r}...")
        try:
            conn = psycopg2.connect(conn_str, connect_timeout=5)
            print("Connection Success!")
            break
        except Exception as e:
            print(f"Failed to connect to {r}: {e}")
            
    if not conn:
        print("Could not connect to any pooler region.")
        return
        
    try:
        cur = conn.cursor()
        
        # 1. List all tables containing 'trans' or 'tran'
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public' AND (table_name LIKE '%trans%' OR table_name LIKE '%tran%')
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"\nMatching tables: {tables}")
        
        # 2. Get columns for each matching table
        for table in tables:
            print(f"\n=== Columns for Table: {table} ===")
            cur.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema='public' AND table_name=%s
                ORDER BY ordinal_position
            """, (table,))
            for col in cur.fetchall():
                print(f"  {col[0]}: {col[1]} (Nullable: {col[2]})")
                
        cur.close()
    finally:
        conn.close()

if __name__ == '__main__':
    discover()
