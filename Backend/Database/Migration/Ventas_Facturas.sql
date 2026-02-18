-- ============================================
-- TABLA: VENTAS (Corregida)
-- ============================================
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    
    -- Cliente registrado (OPCIONAL)
    cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
    
    -- Datos de cliente ocasional (OPCIONALES - solo si no hay cliente_id)
    cliente_nombre VARCHAR(200),
    cliente_telefono VARCHAR(20),
    cliente_referencia VARCHAR(200),
    
    -- Usuario que registra la venta
    usuario_id INT NOT NULL REFERENCES usuario(id_usuario),
    
    -- Datos de la venta
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    tipo_pago VARCHAR(20) NOT NULL, -- 'contado', 'credito', 'mixto'
    estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'pagada', 'cancelada'
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_cliente 
        CHECK (cliente_id IS NOT NULL OR cliente_nombre IS NOT NULL),
    
    CONSTRAINT check_credito_cliente_registrado
        CHECK (tipo_pago != 'credito' OR cliente_id IS NOT NULL),
    
    CONSTRAINT check_totales
        CHECK (total = subtotal - descuento AND total >= 0),
    
    CONSTRAINT check_tipo_pago
        CHECK (tipo_pago IN ('contado', 'credito', 'mixto')),
    
    CONSTRAINT check_estado
        CHECK (estado IN ('pendiente', 'pagada', 'cancelada'))
);

-- Índices para VENTAS
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_ventas_estado ON ventas(estado);
CREATE INDEX idx_ventas_tipo_pago ON ventas(tipo_pago);
CREATE INDEX idx_ventas_numero_factura ON ventas(numero_factura);

-- Trigger para updated_at
CREATE TRIGGER update_ventas_updated_at 
    BEFORE UPDATE ON ventas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE ventas IS 'Registro de ventas del sistema';
COMMENT ON COLUMN ventas.cliente_id IS 'Cliente registrado (NULL si es ocasional)';
COMMENT ON COLUMN ventas.cliente_nombre IS 'Nombre de cliente ocasional (NULL si es registrado)';
COMMENT ON CONSTRAINT check_credito_cliente_registrado ON ventas IS 'Las ventas a crédito requieren cliente registrado';
