-- Eliminar la vista anterior
DROP VIEW IF EXISTS cuentas_por_cobrar CASCADE;

-- Crear la vista corregida
CREATE VIEW cuentas_por_cobrar AS
SELECT 
    -- Información del cliente
    v.cliente_id,
    COALESCE(c.nombre, v.cliente_nombre) as nombre,
    c.apodo,
    v.cliente_referencia as referencia,
    COALESCE(c.telefono, v.cliente_telefono) as telefono,
    CASE 
        WHEN v.cliente_id IS NOT NULL THEN 'registrado'
        ELSE 'ocasional'
    END as tipo_cliente,
    
    -- ✅ CORRECCIÓN: Sumar v.total SIN JOIN con pagos
    SUM(v.total) as total_ventas,
    
    -- ✅ CORRECCIÓN: Calcular total pagado con subconsulta
    COALESCE(
        (
            SELECT SUM(p.monto)
            FROM pagos p
            WHERE p.venta_id IN (
                SELECT v2.id 
                FROM ventas v2 
                WHERE (v2.cliente_id = v.cliente_id OR v2.cliente_nombre = v.cliente_nombre)
                  AND v2.tipo_pago IN ('credito', 'mixto')
                  AND v2.estado != 'cancelada'
            )
        ), 
        0
    ) as total_pagado,
    
    -- Saldo pendiente
    SUM(v.total) - COALESCE(
        (
            SELECT SUM(p.monto)
            FROM pagos p
            WHERE p.venta_id IN (
                SELECT v2.id 
                FROM ventas v2 
                WHERE (v2.cliente_id = v.cliente_id OR v2.cliente_nombre = v.cliente_nombre)
                  AND v2.tipo_pago IN ('credito', 'mixto')
                  AND v2.estado != 'cancelada'
            )
        ), 
        0
    ) as saldo_pendiente,
    
    -- Número de facturas
    COUNT(DISTINCT v.id) as num_facturas,
    
    -- Fecha de última compra
    MAX(v.fecha_venta) as ultima_compra,
    
    -- Fecha de último pago
    (
        SELECT MAX(p.fecha_pago)
        FROM pagos p
        WHERE p.venta_id IN (
            SELECT v2.id 
            FROM ventas v2 
            WHERE (v2.cliente_id = v.cliente_id OR v2.cliente_nombre = v.cliente_nombre)
              AND v2.tipo_pago IN ('credito', 'mixto')
              AND v2.estado != 'cancelada'
        )
    ) as ultimo_pago,
    
    -- Días de mora (desde la última compra)
    EXTRACT(DAY FROM (NOW() - MAX(v.fecha_venta)))::INTEGER as dias_mora

FROM ventas v
LEFT JOIN clientes c ON v.cliente_id = c.id
WHERE v.tipo_pago IN ('credito', 'mixto')
  AND v.estado != 'cancelada'
GROUP BY 
    v.cliente_id,
    c.nombre,
    c.apodo,
    c.telefono,
    v.cliente_nombre,
    v.cliente_telefono,
    v.cliente_referencia
HAVING 
    -- Solo mostrar clientes con saldo pendiente
    SUM(v.total) - COALESCE(
        (
            SELECT SUM(p.monto)
            FROM pagos p
            WHERE p.venta_id IN (
                SELECT v2.id 
                FROM ventas v2 
                WHERE (v2.cliente_id = v.cliente_id OR v2.cliente_nombre = v.cliente_nombre)
                  AND v2.tipo_pago IN ('credito', 'mixto')
                  AND v2.estado != 'cancelada'
            )
        ), 
        0
    ) > 0
ORDER BY dias_mora DESC, saldo_pendiente DESC;