-- Vista completa de ventas con variantes
CREATE VIEW ventas_completas AS
SELECT 
    v.id as venta_id,
    v.numero_factura,
    v.fecha_venta,
    v.total as venta_total,
    v.estado as venta_estado,
    c.nombre as cliente_nombre,
    c.apodo as cliente_apodo,
    vd.id as detalle_id,
    p.nombre as producto_nombre,
    m.nombre as marca_nombre,
    vd.talla_vendida as talla,
    vd.color_vendido as color,
    vd.genero_vendido as genero,
    vd.cantidad,
    vd.precio_unitario,
    vd.subtotal
FROM ventas v
LEFT JOIN clientes c ON v.cliente_id = c.id
JOIN ventas_detalle vd ON v.id = vd.venta_id
JOIN productos p ON vd.producto_id = p.id
LEFT JOIN marcas m ON p.marca_id = m.id;