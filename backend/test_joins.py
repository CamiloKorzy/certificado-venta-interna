import psycopg2
import os
from dotenv import load_dotenv
load_dotenv('.env')

DB_HOST = os.environ.get("DB_HOST", "ceesa.dw.finneg.com")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "finnegansbi")
DB_USER = os.environ.get("DB_USER", "ceesauser")
DB_PASS = os.environ.get("DB_PASS", "Lula$$2014")

try:
    conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS, sslmode="require")
    cur = conn.cursor()
    
    # Test joining BSAsientoItem, BSTransaccion, FAFTransaccionSubtipo, FAFTransaccionCategoria
    sql = """
    SELECT 
        FAFTransaccionSubtipo.transaccionsubtipoid,
        FAFTransaccionCategoria.transaccioncategoriaid
    FROM ceesa_bsasientoitem AS BSAsientoItem
    INNER JOIN ceesa_bscuenta AS BSCuenta ON BSAsientoItem.cuentaid = BSCuenta.cuentaid
    INNER JOIN ceesa_bstransaccion AS BSTransaccion ON BSAsientoItem.transaccionid = BSTransaccion.transaccionid
    INNER JOIN ceesa_faftransaccionsubtipo AS FAFTransaccionSubtipo ON BSTransaccion.transaccionsubtipoid = FAFTransaccionSubtipo.transaccionsubtipoid
    INNER JOIN ceesa_faftransaccioncategoria AS FAFTransaccionCategoria ON FAFTransaccionSubtipo.transaccioncategoriaid = FAFTransaccionCategoria.transaccioncategoriaid
    LIMIT 1
    """
    cur.execute(sql)
    print("Test successful, joined row:", cur.fetchone())
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
