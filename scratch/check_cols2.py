import socket
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    kwargs['family'] = socket.AF_INET
    return old_getaddrinfo(*args, **kwargs)
socket.getaddrinfo = new_getaddrinfo

import psycopg2
import psycopg2.extras

url = 'postgresql://camilok:Hormi2026..!!@ceesaa.c5eom2siy7g4.sa-east-1.rds.amazonaws.com:5432/finnegansbi'
conn = psycopg2.connect(url)
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
cur.execute("SELECT * FROM ceesa_cee_tracking_de_ventas_v11 LIMIT 1")
row = cur.fetchone()
print(list(row.keys()))
