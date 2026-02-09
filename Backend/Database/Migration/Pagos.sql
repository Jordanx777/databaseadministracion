-- Pagos/Abonos
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    venta_id INT REFERENCES ventas(id),
    cliente_id INT REFERENCES clientes(id),
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50), -- 'efectivo', 'nequi', 'transferencia'
    referencia VARCHAR(100),
    notas TEXT,
    registrado_por INT REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);