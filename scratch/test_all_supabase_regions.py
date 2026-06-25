import psycopg2
import concurrent.futures

regions = [
    "sa-east-1", "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ca-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1",
    "eu-central-2", "eu-south-1", "ap-northeast-1", "ap-northeast-2",
    "ap-northeast-3", "ap-southeast-1", "ap-southeast-2", "ap-south-1",
    "ap-southeast-3", "me-central-1"
]

def try_region(r):
    for prefix in ["aws-0", "aws-1"]:
        host = f"{prefix}-{r}.pooler.supabase.com"
        conn_str = f"postgresql://postgres.naxjzquhdzyoxtjataaw:Lula$$2014$$@{host}:5432/postgres"
        try:
            conn = psycopg2.connect(conn_str, connect_timeout=3)
            conn.close()
            return f"SUCCESS: {host}"
        except Exception as e:
            if "tenant/user postgres.naxjzquhdzyoxtjataaw not found" not in str(e):
                # If we get a password error or connection timeout, the tenant WAS found!
                # Wait, if password is wrong, it means the tenant is correct.
                # If connection timeout, maybe the tenant is correct but port is blocked.
                # If tenant not found, it is always "tenant/user ... not found".
                return f"TENANT FOUND AT {host} but error: {e}"
            pass
    return None

def test_all():
    print("Scanning all Supabase regions for tenant naxjzquhdzyoxtjataaw...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(try_region, regions)
        for r, res in zip(regions, results):
            if res:
                print(res)

if __name__ == '__main__':
    test_all()
