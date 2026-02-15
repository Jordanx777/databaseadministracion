-- Tabla VENTAS (con campos opcionales de cliente)
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE,
    
    -- Cliente registrado (OPCIONAL)
    cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
    
    -- Datos de cliente ocasional (OPCIONALES - solo si no hay cliente_id)
    cliente_nombre VARCHAR(200),      -- Nombre rápido sin registro
    cliente_telefono VARCHAR(20),     -- Por si quiere dejarlo
    cliente_referencia VARCHAR(200),  -- "el de la moto", "el primo de...", etc.
    
    usuario_id INT REFERENCES usuarios(id),
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    tipo_pago VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Debe tener O cliente_id O cliente_nombre
    CONSTRAINT check_cliente 
    CHECK (cliente_id IS NOT NULL OR cliente_nombre IS NOT NULL)
);

-- Detalle de ventas
CREATE TABLE ventas_detalle (
    id SERIAL PRIMARY KEY,
    venta_id INT REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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