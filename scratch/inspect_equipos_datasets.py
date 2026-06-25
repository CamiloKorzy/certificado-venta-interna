import psycopg2

DB_HOST = "infraestructura-aurora-datawarehouse-instance-zxhlvevffc1c.cijt7auhxunw.us-east-1.rds.amazonaws.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def inspect_table(cur, table_name):
    print(f"\n=================== TABLE: {table_name} ===================")
    # Get columns
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}'")
    cols = cur.fetchall()
    print("Columns:")
    for c in cols:
        print(f"  {c[0]}: {c[1]}")
    
    # Get count
    cur.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cur.fetchone()[0]
    print(f"Total rows: {count}")
    
    if count == 0:
        return
        
    # Find any date/fecha columns to check min/max
    date_cols = [c[0] for c in cols if 'fecha' in c[0].lower() or 'date' in c[0].lower()]
    print(f"Date columns: {date_cols}")
    for dc in date_cols:
        try:
            cur.execute(f"SELECT MIN({dc}), MAX({dc}) FROM {table_name}")
            min_v, max_v = cur.fetchone()
            print(f"  Column '{dc}' range: {min_v} to {max_v}")
        except Exception as e:
            print(f"  Error querying range for '{dc}': {e}")
            
    # Sample row
    try:
        cur.execute(f"SELECT * FROM {table_name} LIMIT 1")
        row = cur.fetchone()
        if row:
            desc = [d[0] for d in cur.description]
            sample = dict(zip(desc, row))
            print("Sample row:")
            for k, v in sample.items():
                print(f"  {k}: {v}")
    except Exception as e:
        print(f"Error printing sample row: {e}")

def run():
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    cur = conn.cursor()
    
    tables = [
        "ceesa_cee_equipos_trabajos_realizados",
        "ceesa_cee_equipos_ordenes_de_trabajo_y_partes_de_mantenimiento",
        "ceesa_cee_consumo_combutible_maquinas"
    ]
    
    for t in tables:
        try:
            inspect_table(cur, t)
        except Exception as e:
            print(f"Error inspecting table {t}: {e}")
            conn.rollback()
            
    cur.close()
    conn.close()

if __name__ == '__main__':
    run()
