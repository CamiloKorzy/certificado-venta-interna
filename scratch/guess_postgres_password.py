import psycopg2

def test_passwords():
    host = "aws-0-us-east-2.pooler.supabase.com"
    port = 6543
    user = "postgres.naxjzquhdzyoxtjataaw"
    
    passwords = [
        "Ceesa2023*",
        "Lula$$2014$$",
        "Lula$$2014",
        "Lula$$2014$$$$",
        "Ceesa2023",
        "postgres"
    ]
    
    for pwd in passwords:
        print(f"Trying password '{pwd}'...")
        try:
            conn = psycopg2.connect(
                host=host,
                port=port,
                database="postgres",
                user=user,
                password=pwd,
                connect_timeout=4
            )
            print(f"SUCCESS! Connected with password: {pwd}")
            conn.close()
            return
        except Exception as e:
            print(f"  Failed: {e}")

if __name__ == '__main__':
    test_passwords()
