import psycopg2

DB_HOST = "ceesa.dw.finneg.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def main():
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    cur = conn.cursor()
        
    cur.execute("""
        SELECT transaccionid, cuentaid, fecha, debehaber, importemonprincipal, descripcion, itemtipo
        FROM ceesa_bsasientoitem
        LIMIT 10;
    """)
    print("\nAsientos:")
    for r in cur.fetchall():
        print(r)

if __name__ == "__main__":
    main()
