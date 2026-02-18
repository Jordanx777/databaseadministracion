-- ============================================
-- VISTA: CUENTAS_POR_COBRAR (Actualizada)
-- ============================================
CREATE VIEW cuentas_por_cobrar AS
SELECT 
    -- Identificación del cliente
    v.cliente_id,
    COALESCE(c.nombre, v.cliente_nombre) as nombre,
    c.apodo,
    COALESCE(c.referencia, v.cliente_referencia) as referencia,
    COALESCE(c.telefono, v.cliente_telefono) as telefono,
    
    -- Tipo de cliente
    CASE 
        WHEN v.cliente_id IS NOT NULL THEN 'registrado'
        ELSE 'ocasional'
    END as tipo_cliente,
    
    -- Cálculos financieros
    COALESCE(SUM(v.total), 0) as total_ventas,
    COALESCE(SUM(p.monto), 0) as total_pagado,
    COALESCE(SUM(v.total), 0) - COALESCE(SUM(p.monto), 0) as saldo_pendiente,
    
    -- Estadísticas
    COUNT(DISTINCT v.id) as num_facturas,
    MAX(v.fecha_venta) as ultima_compra,
    MAX(p.fecha_pago) as ultimo_pago,
    
    -- Días de mora (desde la venta más antigua sin pagar)
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MIN(v.fecha_venta))) as dias_mora
    
FROM ventas v
LEFT JOIN clientes c ON v.cliente_id = c.id
LEFT JOIN pagos p ON v.id = p.venta_id
WHERE v.tipo_pago IN ('credito', 'mixto') 
  AND v.estado != 'cancelada'
GROUP BY 
    v.cliente_id, 
    c.nombre, 
    v.cliente_nombre,
    c.apodo, 
    c.referencia, 
    v.cliente_referencia,
    c.telefono,
    v.cliente_telefono
HAVING COALESCE(SUM(v.total), 0) - COALESCE(SUM(p.monto), 0) > 0
ORDER BY saldo_pendiente DESC;

COMMENT ON VIEW cuentas_por_cobrar IS 'Vista de clientes con saldo pendiente (registrados y ocasionales)';