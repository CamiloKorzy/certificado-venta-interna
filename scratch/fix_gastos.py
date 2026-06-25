import re

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    # Reemplazos en InformeGestion.tsx
    c = c.replace("'gastos'", "'costos'")
    c = c.replace('Detalle de Gastos', 'Detalle de Costos')
    c = c.replace('exportGastosToxlsx', 'exportCostosToxlsx')
    c = c.replace('wsGastos', 'wsCostos')
    c = c.replace('"Gastos"', '"Costos"')
    c = c.replace('Egresos_', 'Costos_')
    c = c.replace('gastosPorRubro', 'costosPorRubro')
    c = c.replace('Exportar Egresos', 'Exportar Costos')
    c = c.replace('Exportar Gastos', 'Exportar Costos')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)

process_file('frontend/src/components/InformeGestion.tsx')
process_file('frontend/src/App.tsx')
