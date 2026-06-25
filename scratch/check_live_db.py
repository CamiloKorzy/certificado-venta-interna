import sys
sys.path.append('backend')
from main import get_aurora

def run():
    conn_aurora = get_aurora()
    cur_aurora = conn_aurora.cursor()

    cur_aurora.execute('''
        SELECT *
        FROM ceesa_cee_certificados_ventas_internas
        WHERE documento = 'CERTIFICADO_VENTA_INTERNO - 41'
    ''')
    rows = cur_aurora.fetchall()
    cols = [desc[0] for desc in cur_aurora.description]
    
    print('Columns in ceesa_cee_certificados_ventas_internas:', cols)
    print(f'Total rows found: {len(rows)}')
    
    # Compare first two duplicate rows of Horas Diurnas 1224000.0000
    diurnas_rows = [r for r in rows if r[cols.index('productonombre')] == 'Horas Diurnas' and float(r[cols.index('itemimporte')]) == 1224000.0]
    print(f'Found {len(diurnas_rows)} diurnas rows with 1224000.0')
    if len(diurnas_rows) > 1:
        row1 = dict(zip(cols, diurnas_rows[0]))
        row2 = dict(zip(cols, diurnas_rows[1]))
        diffs = {}
        for k in cols:
            if row1[k] != row2[k]:
                diffs[k] = (row1[k], row2[k])
        print('Differences between first two duplicates:', diffs)

    cur_aurora.close()
    conn_aurora.close()

if __name__ == '__main__':
    run()
