import psycopg2
import sys

SUPABASE_DB_URL = "postgresql://postgres:FsIPyXBJT8aFZk8D@db.rsofgomdfrrvawvqybxp.supabase.co:5432/postgres"
DB_HOST = "ceesa.dw.finneg.com"
DB_PORT = "5432"
DB_NAME = "finnegansbi"
DB_USER = "ceesauser"
DB_PASS = "Lula$$2014"

def get_aurora():
    return psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")

def get_supabase():
    return psycopg2.connect(SUPABASE_DB_URL, connect_timeout=10)

def test_asientos():
    sucursal = "Seguridad de Activos"
    fecha_desde = "2026-05-01"
    fecha_hasta = "2026-05-31"
    
    conn_supa = get_supabase()
    cur_supa = conn_supa.cursor()
    cur_supa.execute("SELECT tipo_asiento_id FROM cert_config_gastos_asientos WHERE sucursal = %s", (sucursal,))
    tipos = [row[0] for row in cur_supa.fetchall()]
    cur_supa.close()
    conn_supa.close()
    
    if not tipos:
        print("No tipos_asiento_id found for", sucursal)
        return
        
    conn = get_aurora()
    cur = conn.cursor()
    
    sql = """
    SELECT 
        BSAsientoItem.Fecha,
        BSCuenta.Codigo,
        BSCuenta.Nombre,
        BSAsientoItem.Descripcion,
        (COALESCE(BSAsientoItem.ImporteMonPrincipal, 0) * BSAsientoItem.DebeHaber) AS Importe,
        BSTransaccion.TransaccionSubtipoID
    FROM BSAsientoItem
    INNER JOIN BSCuenta ON BSAsientoItem.CuentaID = BSCuenta.CuentaID
    INNER JOIN BSTransaccion ON BSAsientoItem.TransaccionID = BSTransaccion.TransaccionID
    WHERE BSTransaccion.TransaccionSubtipoID IN %s
      AND BSAsientoItem.Fecha >= %s
      AND BSAsientoItem.Fecha <= %s
    LIMIT 10
    """
    cur.execute(sql, (tuple(tipos), fecha_desde, fecha_hasta))
    print("\n--- ASIENTOS ---")
    for r in cur.fetchall():
        print(r)
    conn.close()

def test_rrhh():
    sucursal = "Seguridad de Activos"
    periodo_str = "202605"
    
    conn_supa = get_supabase()
    cur_supa = conn_supa.cursor()
    cur_supa.execute("SELECT nombre FROM cert_config_centros_costo WHERE sucursal = %s", (sucursal,))
    centros = [row[0] for row in cur_supa.fetchall()]
    cur_supa.close()
    conn_supa.close()
    
    if not centros:
        print("No centros de costo found for", sucursal)
        return
        
    conn = get_aurora()
    cur = conn.cursor()
    
    sql = """
    SELECT
        legajo,
        apellidonombre,
        centrocosto,
        tipoconcepto,
        SUM(CAST(REPLACE(importe, ',', '.') AS NUMERIC)) as importe
    FROM ceesa_cee_liquidaciones_de_sueldos_
    WHERE periodo = %s
      AND centrocosto IN %s
    GROUP BY
        legajo, apellidonombre, centrocosto, tipoconcepto
    LIMIT 10
    """
    cur.execute(sql, (periodo_str, tuple(centros)))
    print("\n--- RRHH ---")
    for r in cur.fetchall():
        print(r)
    conn.close()

if __name__ == "__main__":
    test_asientos()
    test_rrhh()
