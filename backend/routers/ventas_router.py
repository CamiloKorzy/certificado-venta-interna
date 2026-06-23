import os
import psycopg2
import psycopg2.extras
from fastapi import APIRouter, Query
from typing import List, Optional
from contextlib import contextmanager

router = APIRouter()

@contextmanager
def get_db():
    from main import get_aurora
    conn = get_aurora()
    try:
        yield conn
    finally:
        conn.close()

def parse_list(value: Optional[str]) -> List[str]:
    if not value or value.strip() == "":
        return []
    return [v.strip() for v in value.split(",") if v.strip()]

def get_sucursales_table(cur):
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%sucursales%' ORDER BY table_name DESC LIMIT 1")
    row = cur.fetchone()
    if row:
        return row[0]
    return "ceesa_cee_sucursales"

def build_filters(periodos: List[str], empresas: List[str], clientes: List[str], productos: List[str] = None, fecha_desde: Optional[str] = None, fecha_hasta: Optional[str] = None, prefix: str = "") -> tuple:
    clauses = []
    params = []
    p = prefix
    
    # Helper para fechas limpias
    clean_date = f"CAST(NULLIF(NULLIF({p}remitofecha, ''), 'NULL') AS date)"
    
    if periodos:
        phs = ",".join(["%s"] * len(periodos))
        clauses.append(f"TO_CHAR({clean_date}, 'MM-YYYY') IN ({phs})")
        params.extend(periodos)
    if empresas:
        try:
            with get_db() as conn:
                with conn.cursor() as cur:
                    suc_table = get_sucursales_table(cur)
                    phs = ",".join(["%s"] * len(empresas))
                    sub_q = f"""
                        SELECT c1.nombreempresa 
                        FROM {suc_table} c1
                        LEFT JOIN {suc_table} c2 ON c1.codigoempresapadre = c2.codigoempresa
                        WHERE COALESCE(c2.nombreempresa, c1.nombreempresa) IN ({phs})
                    """
                    cur.execute(sub_q, tuple(empresas))
                    matched_sucursales = [r[0] for r in cur.fetchall()]
                    if not matched_sucursales:
                        matched_sucursales = empresas
        except:
            matched_sucursales = empresas

        phs_suc = ",".join(["%s"] * len(matched_sucursales))
        clauses.append(f"NULLIF(NULLIF({p}empresa, ''), 'NULL') IN ({phs_suc})")
        params.extend(matched_sucursales)
    if clientes:
        phs = ",".join(["%s"] * len(clientes))
        clauses.append(f"NULLIF(NULLIF({p}cliente, ''), 'NULL') IN ({phs})")
        params.extend(clientes)
    if productos:
        phs = ",".join(["%s"] * len(productos))
        clauses.append(f"NULLIF(NULLIF({p}producto, ''), 'NULL') IN ({phs})")
        params.extend(productos)
    
    if fecha_desde:
        clauses.append(f"{clean_date} >= CAST(%s AS date)")
        params.append(fecha_desde)
    
    if fecha_hasta:
        clauses.append(f"{clean_date} <= CAST(%s AS date)")
        params.append(fecha_hasta)
    
    sql = " AND ".join(clauses) if clauses else "1=1"
    return sql, tuple(params)

# MAESTROS
@router.get("/periodos")
def get_periodos():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT DISTINCT TO_CHAR(CAST(NULLIF(NULLIF(remitofecha, ''), 'NULL') AS date), 'MM-YYYY') AS periodo, "
                "TO_CHAR(CAST(NULLIF(NULLIF(remitofecha, ''), 'NULL') AS date), 'YYYY-MM') AS sort_col "
                "FROM ceesa_cee_tracking_de_ventas_v11 "
                "WHERE NULLIF(NULLIF(remitofecha, ''), 'NULL') IS NOT NULL "
                "ORDER BY sort_col DESC"
            )
            rows = cur.fetchall()
    return [{"periodo": r[0], "label": r[0]} for r in rows if r[0]]

@router.get("/empresas")
def get_empresas():
    with get_db() as conn:
        with conn.cursor() as cur:
            suc_table = get_sucursales_table(cur)
            try:
                cur.execute(f"""
                    SELECT DISTINCT COALESCE(c2.nombreempresa, c1.nombreempresa) as empresa_padre
                    FROM ceesa_cee_tracking_de_ventas_v11 t
                    JOIN {suc_table} c1 ON t.empresa = c1.nombreempresa
                    LEFT JOIN {suc_table} c2 ON c1.codigoempresapadre = c2.codigoempresa
                    WHERE NULLIF(NULLIF(t.empresa, ''), 'NULL') IS NOT NULL
                    ORDER BY 1
                """)
                rows = cur.fetchall()
                if rows and rows[0][0]:
                    return [r[0] for r in rows if r[0]]
            except Exception as e:
                pass
                
            cur.execute("SELECT DISTINCT empresa FROM ceesa_cee_tracking_de_ventas_v11 WHERE NULLIF(NULLIF(empresa, ''), 'NULL') IS NOT NULL ORDER BY empresa")
            rows = cur.fetchall()
            
    return [r[0] for r in rows if r[0]]

@router.get("/clientes")
def get_clientes(empresas: Optional[str] = Query(None)):
    emp_list = parse_list(empresas)
    with get_db() as conn:
        with conn.cursor() as cur:
            if emp_list:
                _, params = build_filters([], emp_list, [])
                phs = ",".join(["%s"] * len(params))
                cur.execute(f"SELECT DISTINCT cliente FROM ceesa_cee_tracking_de_ventas_v11 WHERE NULLIF(NULLIF(cliente, ''), 'NULL') IS NOT NULL AND NULLIF(NULLIF(empresa, ''), 'NULL') IN ({phs}) ORDER BY cliente", params)
            else:
                cur.execute("SELECT DISTINCT cliente FROM ceesa_cee_tracking_de_ventas_v11 WHERE NULLIF(NULLIF(cliente, ''), 'NULL') IS NOT NULL ORDER BY cliente")
            rows = cur.fetchall()
    return [r[0] for r in rows if r[0]]

@router.get("/productos")
def get_productos(empresas: Optional[str] = Query(None), clientes: Optional[str] = Query(None)):
    emp_list = parse_list(empresas)
    cli_list = parse_list(clientes)
    with get_db() as conn:
        with conn.cursor() as cur:
            where_sql, params = build_filters([], emp_list, cli_list)
            cur.execute(f"SELECT DISTINCT producto FROM ceesa_cee_tracking_de_ventas_v11 WHERE NULLIF(NULLIF(producto, ''), 'NULL') IS NOT NULL AND {where_sql} ORDER BY producto", params)
            rows = cur.fetchall()
    return [r[0] for r in rows if r[0]]

# KPIS
@router.get("/resumen")
def get_resumen(
    periodos: Optional[str] = Query(None),
    empresas: Optional[str] = Query(None),
    clientes: Optional[str] = Query(None),
    productos: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None)
):
    try:
        p_list = parse_list(periodos)
        e_list = parse_list(empresas)
        c_list = parse_list(clientes)
        prod_list = parse_list(productos)
        where_sql, params = build_filters(p_list, e_list, c_list, prod_list, fecha_desde, fecha_hasta)
        
        with get_db() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # 1. Remitos
                cur.execute(f"SELECT COUNT(DISTINCT remitonumero) as cant FROM ceesa_cee_tracking_de_ventas_v11 WHERE {where_sql} AND NULLIF(NULLIF(remitonumero, ''), 'NULL') IS NOT NULL", params)
                cant_remitos = int(cur.fetchone()['cant'] or 0)
                
                # 2. Remitos Pte Fact
                cur.execute(f"SELECT COUNT(DISTINCT remitonumero) as cant FROM ceesa_cee_tracking_de_ventas_v11 WHERE {where_sql} AND NULLIF(NULLIF(remitonumero, ''), 'NULL') IS NOT NULL AND (CAST(NULLIF(NULLIF(cantidadpendientefacturar, ''), 'NULL') AS numeric) > 0 OR NULLIF(NULLIF(facturanumero, ''), 'NULL') IS NULL)", params)
                cant_remitos_pte_fact = int(cur.fetchone()['cant'] or 0)
                cant_remitos_facturados = cant_remitos - cant_remitos_pte_fact
                
                # 3. Facturas
                cur.execute(f"SELECT COUNT(DISTINCT facturanumero) as cant FROM ceesa_cee_tracking_de_ventas_v11 WHERE {where_sql} AND NULLIF(NULLIF(facturanumero, ''), 'NULL') IS NOT NULL", params)
                cant_facturas = int(cur.fetchone()['cant'] or 0)
                
                # 4. Facturas Pte Cobro (Invoices that DO NOT have any PROCESO COMPLETO row)
                pending_invoices_sql = f"""
                    SELECT facturanumero 
                    FROM ceesa_cee_tracking_de_ventas_v11 
                    WHERE {where_sql} AND NULLIF(NULLIF(facturanumero, ''), 'NULL') IS NOT NULL 
                    GROUP BY facturanumero 
                    HAVING MAX(CASE WHEN estadoproceso = 'PROCESO COMPLETO' THEN 1 ELSE 0 END) = 0
                """
                cur.execute(f"SELECT COUNT(*) as cant FROM ({pending_invoices_sql}) t", params)
                cant_facturas_pte_cobro = int(cur.fetchone()['cant'] or 0)
                
                # 5. Importes deduplicados
                q_facturado = f"SELECT COALESCE(SUM(importe), 0) FROM (SELECT DISTINCT ON (facturanumero) CAST(NULLIF(NULLIF(facturaimporte, ''), 'NULL') AS numeric) as importe FROM ceesa_cee_tracking_de_ventas_v11 WHERE {where_sql} AND NULLIF(NULLIF(facturanumero, ''), 'NULL') IS NOT NULL) t"
                q_cobrado = f"SELECT COALESCE(SUM(importe), 0) FROM (SELECT DISTINCT ON (facturanumero, cobranzanumero) CAST(NULLIF(NULLIF(importeaplicado, ''), 'NULL') AS numeric) as importe FROM ceesa_cee_tracking_de_ventas_v11 WHERE {where_sql} AND NULLIF(NULLIF(cobranzanumero, ''), 'NULL') IS NOT NULL) t"
                
                cur.execute(q_facturado, params)
                imp_facturas = float(cur.fetchone()['coalesce'] or 0)
                
                cur.execute(q_cobrado, params)
                imp_cobrado = float(cur.fetchone()['coalesce'] or 0)
                imp_pte_cobro = max(0, imp_facturas - imp_cobrado)
                
                # 6. Tiempos
                q_delays = f"""
                SELECT 
                    AVG(CAST(NULLIF(NULLIF(facturafecha, ''), 'NULL') AS date) - CAST(NULLIF(NULLIF(remitofecha, ''), 'NULL') AS date)) as avg_dias_fact,
                    AVG(CAST(NULLIF(NULLIF(cobranzafecha, ''), 'NULL') AS date) - CAST(NULLIF(NULLIF(facturafecha, ''), 'NULL') AS date)) as avg_dias_cobro
                FROM ceesa_cee_tracking_de_ventas_v11
                WHERE {where_sql}
                """
                cur.execute(q_delays, params)
                delays = cur.fetchone()
                avg_dias_fact = float(delays['avg_dias_fact'] or 0)
                avg_dias_cobro = float(delays['avg_dias_cobro'] or 0)

                # 7. Tabla resumen por empresa
                # Se reutiliza el pending_invoices_sql the forma literal para forzar paridad matemática entre indicador global y grilla por empresa
                q_emp_stats = f"""
                SELECT 
                    empresa,
                    COUNT(DISTINCT CASE WHEN CAST(NULLIF(NULLIF(cantidadpendientefacturar, ''), 'NULL') AS numeric) > 0 OR NULLIF(NULLIF(facturanumero, ''), 'NULL') IS NULL THEN remitonumero ELSE NULL END) as remitos_pte_fact,
                    COUNT(DISTINCT CASE WHEN NULLIF(NULLIF(t_main.facturanumero, ''), 'NULL') IS NOT NULL AND t_main.facturanumero IN ({pending_invoices_sql}) THEN t_main.facturanumero ELSE NULL END) as facturas_pte_cobro,
                    COUNT(DISTINCT remitonumero) as remitos_totales
                FROM ceesa_cee_tracking_de_ventas_v11 t_main
                WHERE {where_sql} AND NULLIF(NULLIF(empresa, ''), 'NULL') IS NOT NULL
                GROUP BY empresa
                """
                cur.execute(q_emp_stats, params + params)
                empresas_stats = [dict(r) for r in cur.fetchall()]

        return {
            "cant_remitos": cant_remitos,
            "cant_remitos_facturados": cant_remitos_facturados,
            "cant_remitos_pte_fact": cant_remitos_pte_fact,
            "cant_facturas": cant_facturas,
            "cant_facturas_pte_cobro": cant_facturas_pte_cobro,
            "imp_facturas": imp_facturas,
            "imp_cobrado": imp_cobrado,
            "imp_pte_cobro": imp_pte_cobro,
            "avg_dias_fact": round(avg_dias_fact, 1),
            "avg_dias_cobro": round(avg_dias_cobro, 1),
            "empresas_stats": empresas_stats
        }
    except Exception as e:
        return {"detail": f"Error General en Resumen: {str(e)}"}

# FACTURACION Y RANKINGS
@router.get("/facturacion_stats")
def get_facturacion_stats(
    periodos: Optional[str] = Query(None),
    empresas: Optional[str] = Query(None),
    clientes: Optional[str] = Query(None),
    productos: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None)
):
    try:
        p_list = parse_list(periodos)
        e_list = parse_list(empresas)
        c_list = parse_list(clientes)
        prod_list = parse_list(productos)
        where_sql, params = build_filters(p_list, e_list, c_list, prod_list, fecha_desde, fecha_hasta)
        
        with get_db() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                suc_table = get_sucursales_table(cur)
                
                # 1. Ranking Clientes (Por importe renglon - V1.1)
                q_clientes = f"""
                SELECT cliente, 
                       COUNT(DISTINCT facturanumero) as cant_facturas, 
                       SUM(CAST(NULLIF(NULLIF(preciofacturado, ''), 'NULL') AS numeric) * CAST(NULLIF(NULLIF(cantidadfacturada, ''), 'NULL') AS numeric)) as importe_total
                FROM ceesa_cee_tracking_de_ventas_v11
                WHERE {where_sql} AND NULLIF(NULLIF(facturanumero, ''), 'NULL') IS NOT NULL
                GROUP BY cliente
                ORDER BY importe_total DESC NULLS LAST
                """
                cur.execute(q_clientes, params)
                ranking_clientes = [dict(r) for r in cur.fetchall()]
                
                # 2. Ranking Empresas Padre (Por importe renglon - V1.1)
                where_sql_t, params_t = build_filters(p_list, e_list, c_list, prod_list, fecha_desde, fecha_hasta, prefix="t.")
                q_empresas = f"""
                SELECT COALESCE(c2.nombreempresa, c1.nombreempresa) as empresa_padre, 
                       COUNT(DISTINCT t.facturanumero) as cant_facturas, 
                       SUM(CAST(NULLIF(NULLIF(t.preciofacturado, ''), 'NULL') AS numeric) * CAST(NULLIF(NULLIF(t.cantidadfacturada, ''), 'NULL') AS numeric)) as importe_total
                FROM ceesa_cee_tracking_de_ventas_v11 t
                JOIN {suc_table} c1 ON t.empresa = c1.nombreempresa
                LEFT JOIN {suc_table} c2 ON c1.codigoempresapadre = c2.codigoempresa
                WHERE {where_sql_t} AND NULLIF(NULLIF(t.facturanumero, ''), 'NULL') IS NOT NULL
                GROUP BY COALESCE(c2.nombreempresa, c1.nombreempresa)
                ORDER BY importe_total DESC NULLS LAST
                """
                cur.execute(q_empresas, params_t)
                ranking_empresas = [dict(r) for r in cur.fetchall()]

                # 3. Cantidades por Producto por Cliente
                q_prods = f"""
                SELECT 
                    cliente, 
                    producto,
                    SUM(CAST(NULLIF(NULLIF(cantidaddespachada, ''), 'NULL') AS numeric)) as cant_despachada,
                    SUM(CAST(NULLIF(NULLIF(cantidadfacturada, ''), 'NULL') AS numeric)) as cant_facturada,
                    SUM(CAST(NULLIF(NULLIF(cantidadpendientefacturar, ''), 'NULL') AS numeric)) as cant_pte,
                    SUM(CAST(NULLIF(NULLIF(preciofacturado, ''), 'NULL') AS numeric) * CAST(NULLIF(NULLIF(cantidadfacturada, ''), 'NULL') AS numeric)) as importe_producto
                FROM ceesa_cee_tracking_de_ventas_v11
                WHERE {where_sql} AND NULLIF(NULLIF(producto, ''), 'NULL') IS NOT NULL
                GROUP BY cliente, producto
                ORDER BY importe_producto DESC NULLS LAST, cant_despachada DESC NULLS LAST
                """
                cur.execute(q_prods, params)
                prod_cliente_stats = [dict(r) for r in cur.fetchall()]

        return {
            "ranking_clientes": ranking_clientes,
            "ranking_empresas": ranking_empresas,
            "prod_cliente_stats": prod_cliente_stats
        }
    except Exception as e:
        return {"detail": f"Error General en Rankings: {str(e)}"}

# GRILLA / TRACKING
@router.get("/tracking")
def get_tracking(
    periodos: Optional[str] = Query(None),
    empresas: Optional[str] = Query(None),
    clientes: Optional[str] = Query(None),
    productos: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None)
):
    try:
        p_list = parse_list(periodos)
        e_list = parse_list(empresas)
        c_list = parse_list(clientes)
        prod_list = parse_list(productos)
        where_sql, params = build_filters(p_list, e_list, c_list, prod_list, fecha_desde, fecha_hasta)
        
        query = f"""
            SELECT 
                remitoid, COALESCE(CAST(NULLIF(NULLIF(remitofecha, ''), 'NULL') AS date)::text, '') AS remitofecha, remitonumero, remitotipo, 
                cliente, producto, cantidaddespachada, preciounitario, remitoimporte, cantidadpendientefacturar, empresa, 
                remitoestado, facturaid, facturanumero, COALESCE(CAST(NULLIF(NULLIF(facturafecha, ''), 'NULL') AS date)::text, '') AS facturafecha, 
                facturaimporte, facturatipo, cantidadfacturada, COALESCE(CAST(NULLIF(NULLIF(fechavinculacionfactura, ''), 'NULL') AS date)::text, '') AS fechavinculacionfactura, 
                cobranzaid, cobranzanumero, COALESCE(CAST(NULLIF(NULLIF(cobranzafecha, ''), 'NULL') AS date)::text, '') AS cobranzafecha, 
                cobranzaimporte, importeaplicado, estadoproceso, estadofacturacion, cadenatracking
            FROM ceesa_cee_tracking_de_ventas_v11
            WHERE {where_sql}
            ORDER BY CAST(NULLIF(NULLIF(remitofecha, ''), 'NULL') AS date) DESC NULLS LAST, remitoid
        """
        
        with get_db() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(query, params)
                rows = cur.fetchall()
                    
        return [dict(r) for r in rows]
    except Exception as e:
        return {"detail": f"Error General en Tracking: {str(e)}"}
