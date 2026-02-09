-- Ventas/Facturas
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE,
    cliente_id INT REFERENCES clientes(id),
    usuario_id INT REFERENCES usuarios(id),
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    tipo_pago VARCHAR(20), -- 'contado', 'credito', 'mixto'
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagada, cancelada
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);