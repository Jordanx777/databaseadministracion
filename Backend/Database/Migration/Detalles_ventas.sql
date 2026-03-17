-- ============================================
-- TABLA: VENTAS_DETALLE 
-- ============================================
CREATE TABLE ventas_detalle (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id),
    variante_id INT NOT NULL REFERENCES producto_variantes(id),
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    -- Guardar datos de la variante (snapshot al momento de la venta)
    talla_vendida VARCHAR(20) NOT NULL,
    color_vendido VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_cantidad_positiva 
        CHECK (cantidad > 0),
    
    CONSTRAINT check_precio_positivo 
        CHECK (precio_unitario > 0),
    
    CONSTRAINT check_subtotal_correcto
        CHECK (subtotal = cantidad * precio_unitario)
);

-- Índices para VENTAS_DETALLE
CREATE INDEX idx_ventas_detalle_venta ON ventas_detalle(venta_id);
CREATE INDEX idx_ventas_detalle_producto ON ventas_detalle(producto_id);
CREATE INDEX idx_ventas_detalle_variante ON ventas_detalle(variante_id);

-- Comentarios
COMMENT ON TABLE ventas_detalle IS 'Detalle de productos vendidos en cada venta';
COMMENT ON COLUMN ventas_detalle.talla_vendida IS 'Snapshot de talla al momento de venta';
COMMENT ON COLUMN ventas_detalle.color_vendido IS 'Snapshot de color al momento de venta';

