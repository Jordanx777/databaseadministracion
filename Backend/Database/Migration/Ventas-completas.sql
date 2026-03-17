-- ============================================================================
-- VISTA VENTAS_COMPLETAS (con genero desde productos)
-- ============================================================================

DROP VIEW IF EXISTS ventas_completas CASCADE;

CREATE VIEW ventas_completas AS
SELECT 
    v.id as venta_id,
    v.numero_factura,
    v.fecha_venta,
    v.total as venta_total,
    v.estado as venta_estado,
    v.tipo_pago,
    
    -- Cliente
    COALESCE(c.nombre, v.cliente_nombre) as cliente_nombre,
    c.apodo as cliente_apodo,
    v.cliente_id,
    CASE 
        WHEN v.cliente_id IS NOT NULL THEN 'registrado'
        ELSE 'ocasional'
    END as tipo_cliente,
    
    -- Totales
    COALESCE(SUM(p.monto), 0) as total_pagado,
    v.total - COALESCE(SUM(p.monto), 0) as saldo_pendiente,
    
    -- ✅ Detalles con género desde productos (no desde ventas_detalle)
    (
        SELECT json_agg(
            json_build_object(
                'detalle_id', vd.id,
                'producto_id', vd.producto_id,
                'producto_nombre', prod.nombre,
                'marca_nombre', m.nombre,
                'talla', vd.talla_vendida,
                'color', vd.color_vendido,
                'genero', prod.genero,  -- ✅ Desde productos
                'cantidad', vd.cantidad,
                'precio_unitario', vd.precio_unitario,
                'subtotal', vd.subtotal
            )
        )
        FROM ventas_detalle vd
        JOIN productos prod ON vd.producto_id = prod.id
        LEFT JOIN marcas m ON prod.marca_id = m.id
        WHERE vd.venta_id = v.id
    ) as productos,
    
    -- Pagos
    (
        SELECT json_agg(
            json_build_object(
                'pago_id', pg.id,
                'monto', pg.monto,
                'fecha', pg.fecha_pago,
                'metodo', pg.metodo_pago,
                'referencia', pg.referencia,
                'registrado_por', CONCAT(u.nombre, ' ', u.apellido)
            )
            ORDER BY pg.fecha_pago
        )
        FROM pagos pg
        LEFT JOIN usuario u ON pg.registrado_por = u.id_usuario
        WHERE pg.venta_id = v.id
    ) as pagos
    
FROM ventas v
LEFT JOIN clientes c ON v.cliente_id = c.id
LEFT JOIN pagos p ON v.id = p.venta_id
WHERE v.estado != 'cancelada'
GROUP BY v.id, c.nombre, c.apodo, v.cliente_nombre, v.cliente_id
ORDER BY v.fecha_venta DESC;