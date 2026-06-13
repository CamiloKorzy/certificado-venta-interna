import psycopg2
import json

conn = psycopg2.connect("postgresql://ceesauser:Lula$$2014@ceesa.dw.finneg.com:5432/finnegansbi?sslmode=require")
cur = conn.cursor()

def fetch(sql):
    cur.execute(sql)
    return cur.fetchall()

print("== CATEGORIAS ==")
print(fetch("SELECT TransaccionCategoriaID, Codigo, Nombre FROM ceesa_faftransaccioncategoria LIMIT 5"))

print("== SUBTIPOS ==")
print(fetch("SELECT TransaccionSubtipoID, Codigo, Nombre FROM ceesa_faftransaccionsubtipo LIMIT 5"))

print("== TIPOS ==")
print(fetch("SELECT TransaccionTipoID, Codigo, Nombre FROM ceesa_faftransacciontipo LIMIT 5"))

print("== CENTRO COSTO ==")
print(fetch("SELECT CentroCostoID, Codigo, Nombre FROM ceesa_bscentrocosto LIMIT 5"))

cur.close()
conn.close()
