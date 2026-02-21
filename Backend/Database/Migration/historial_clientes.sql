-- Vista para ver historial de un cliente (registrado u ocasional)
CREATE VIEW historial_cliente AS
SELECT 
    v.id as venta_id,
    v.numero_factura,
    v.fecha_venta,
    v.cliente_id,
    COALESCE(c.nombre, v.cliente_nombre) as cliente_nombre,
    v.total as monto_venta,
    v.tipo_pago,
    v.estado as estado_venta,
    
    -- Total pagado de esta venta
    COALESCE(
        (SELECT SUM(monto) FROM pagos WHERE venta_id = v.id), 
        0
    ) as total_pagado,
    
    -- Saldo pendiente de esta venta
    v.total - COALESCE(
        (SELECT SUM(monto) FROM pagos WHERE venta_id = v.id), 
        0
    ) as saldo_pendiente,
    
    -- Detalle de productos
    (
        SELECT json_agg(
            json_build_object(
                'producto', p.nombre,
                'marca', m.nombre,
                'talla', vd.talla_vendida,
                'color', vd.color_vendido,
                'cantidad', vd.cantidad,
                'precio', vd.precio_unitario
            )
        )
        FROM ventas_detalle vd
        JOIN productos p ON vd.producto_id = p.id
        LEFT JOIN marcas m ON p.marca_id = m.id
        WHERE vd.venta_id = v.id
    ) as productos,
    
    -- Historial de pagos
    (
        SELECT json_agg(
            json_build_object(
                'fecha', pg.fecha_pago,
                'monto', pg.monto,
                'metodo', pg.metodo_pago,
                'referencia', pg.referencia
            )
            ORDER BY pg.fecha_pago
        )
        FROM pagos pg
        WHERE pg.venta_id = v.id
    ) as pagos
    
FROM ventas v
LEFT JOIN clientes c ON v.cliente_id = c.id
ORDER BY v.fecha_venta DESC;