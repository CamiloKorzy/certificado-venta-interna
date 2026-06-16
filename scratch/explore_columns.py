import psycopg2

DB_HOST = "ceesa.dw.finneg.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def get_columns(cur, table_name):
    cur.execute(f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '{table_name}';
    """)
    return cur.fetchall()

def main():
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    cur = conn.cursor()
    
    tables = [
        "ceesa_bsasientoitem",
        "ceesa_cee_legajos",
        "ceesa_cee_liquidaciones_de_sueldos_"
    ]
    
    for t in tables:
        print(f"\n--- {t} ---")
        cols = get_columns(cur, t)
        for c in cols:
            print(f"{c[0]} ({c[1]})")

if __name__ == "__main__":
    main()
