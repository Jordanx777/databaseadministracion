-- ============================================
-- TABLA: PAGOS (Corregida) ⚠️ IMPORTANTE
-- ============================================
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50) NOT NULL, -- 'efectivo', 'nequi', 'transferencia', 'tarjeta'
    referencia VARCHAR(100), -- Número de transacción, etc.
    notas TEXT,
    registrado_por INT NOT NULL REFERENCES usuario(id_usuario),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_monto_positivo 
        CHECK (monto > 0),
    
    CONSTRAINT check_metodo_pago
        CHECK (metodo_pago IN ('efectivo', 'nequi', 'transferencia', 'tarjeta', 'daviplata'))
);

-- Índices para PAGOS
CREATE INDEX idx_pagos_venta ON pagos(venta_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX idx_pagos_registrado_por ON pagos(registrado_por);

-- Comentarios
COMMENT ON TABLE pagos IS 'Registro de pagos y abonos a ventas';
COMMENT ON COLUMN pagos.venta_id IS 'Venta a la que pertenece el pago';
COMMENT ON COLUMN pagos.monto IS 'Monto del pago o abono';
