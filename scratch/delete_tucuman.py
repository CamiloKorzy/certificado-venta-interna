import os
from urllib.parse import quote_plus
import psycopg2

db_url = "postgresql://postgres:FsIPyXBJT8aFZk8D@db.rsofgomdfrrvawvqybxp.supabase.co:5432/postgres"

def run_delete():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("DELETE FROM cert_config_avanzada WHERE sucursal = 'TUCUMAN'")
    cur.execute("DELETE FROM cert_config_centros_costo WHERE sucursal = 'TUCUMAN'")
    conn.commit()
    cur.close()
    conn.close()
    print("Deleted TUCUMAN from configurations")

run_delete()
