import psycopg2
try:
    conn = psycopg2.connect("postgresql://postgres:FsIPyXBJT8aFZk8D@db.rsofgomdfrrvawvqybxp.supabase.co:5432/postgres")
    cur = conn.cursor()
    
    # Check the actual data we're trying to insert
    items = [{"id_ref": "123", "codigo": "TEST", "nombre": "TEST"}]
    sucursal = "Test Sucursal"
    
    # Run the exact code from save_config_centros_costo
    try:
        cur.execute("""
            ALTER TABLE cert_config_centros_costo 
            ALTER COLUMN codigo TYPE TEXT, 
            ALTER COLUMN nombre TYPE TEXT, 
            ALTER COLUMN centro_id TYPE TEXT USING centro_id::text
        """)
    except Exception as e:
        conn.rollback()
        print("Alter table failed:", e)
        
    cur.execute("DELETE FROM cert_config_centros_costo WHERE sucursal = %s", (sucursal,))
    for item in items:
        cur.execute("""
            INSERT INTO cert_config_centros_costo (sucursal, centro_id, codigo, nombre)
            VALUES (%s, %s, %s, %s)
        """, (sucursal, item.get("id_ref"), item.get("codigo"), item.get("nombre")))
    
    conn.commit()
    print("Test Insert Success!")
    
    cur.execute("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'cert_config_centros_costo'")
    print(cur.fetchall())
    
    cur.close()
    conn.close()
except Exception as e:
    print("Database Error:", e)
