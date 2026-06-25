import psycopg2

def test_conn():
    regions = ["sa-east-1", "us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1"]
    passwords = [
        "Lula$$2014$$",
        "Lula$$2014"
    ]
    username = "postgres.naxjzquhdzyoxtjataaw"
    port = 6543
    
    for r in regions:
        host = f"aws-0-{r}.pooler.supabase.com"
        for pwd in passwords:
            print(f"Trying region={r}, pwd={pwd}...")
            try:
                conn = psycopg2.connect(
                    host=host,
                    port=port,
                    database="postgres",
                    user=username,
                    password=pwd,
                    connect_timeout=4
                )
                print(f"SUCCESS in region {r}!")
                cur = conn.cursor()
                cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
                print("Tables:", [row[0] for row in cur.fetchall()])
                cur.close()
                conn.close()
                return
            except Exception as e:
                # print error if it's not a timeout
                err_str = str(e)
                if "tenant/user" not in err_str and "timeout" not in err_str:
                    print(f"  Error on {host}: {e}")
                elif "tenant/user" in err_str:
                    # Tenant not found in this pooler, ignore it
                    pass

if __name__ == '__main__':
    test_conn()
