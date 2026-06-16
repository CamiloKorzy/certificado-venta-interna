import os
from dotenv import load_dotenv
import pyodbc

load_dotenv("backend/.env")

FINNEGANS_SERVER = os.environ.get("FINNEGANS_SERVER")
FINNEGANS_DB = os.environ.get("FINNEGANS_DB")
FINNEGANS_USER = os.environ.get("FINNEGANS_USER")
FINNEGANS_PWD = os.environ.get("FINNEGANS_PWD")

def get_finnegans_connection():
    conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={FINNEGANS_SERVER};DATABASE={FINNEGANS_DB};UID={FINNEGANS_USER};PWD={FINNEGANS_PWD}"
    return pyodbc.connect(conn_str)

conn = get_finnegans_connection()
cur = conn.cursor()

cur.execute("SELECT TOP 10 transaccionid, descripcion, idorigen, operacion, entidadid, receptorid, titularid FROM ceesa_bstransaccion")
rows = cur.fetchall()
for row in rows:
    print(row)

cur.close()
conn.close()
