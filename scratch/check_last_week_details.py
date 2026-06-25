import psycopg2

DB_HOST = "infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def run():
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    cur = conn.cursor()
    
    # Check ceesa_cee_equipos_trabajos_realizados for the last week
    print("Checking ceesa_cee_equipos_trabajos_realizados...")
    cur.execute("""
        SELECT COUNT(*)
        FROM ceesa_cee_equipos_trabajos_realizados
        WHERE CAST(fecha AS TIMESTAMP) >= '2026-06-14'
          AND CAST(fecha AS TIMESTAMP) <= '2026-06-21'
    """)
    count_trabajos = cur.fetchone()[0]
    print(f"Total rows in last week: {count_trabajos}")
    
    # Check ceesa_cee_consumo_combutible_maquinas for the last week
    print("Checking ceesa_cee_consumo_combutible_maquinas...")
    cur.execute("""
        SELECT COUNT(*)
        FROM ceesa_cee_consumo_combutible_maquinas
        WHERE CAST(fecha AS TIMESTAMP) >= '2026-06-14'
          AND CAST(fecha AS TIMESTAMP) <= '2026-06-21'
    """)
    count_combustible = cur.fetchone()[0]
    print(f"Total rows in last week: {count_combustible}")
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    run()
