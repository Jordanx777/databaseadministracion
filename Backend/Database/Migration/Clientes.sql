-- Tabla CLIENTES (se mantiene)
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    apodo VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    referencia VARCHAR(200),
    limite_credito DECIMAL(10,2) DEFAULT 0,
    tipo VARCHAR(20) DEFAULT 'regular', -- 'regular', 'ocasional'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_clientes_nombre ON clientes(nombre);
CREATE INDEX idx_clientes_apodo ON clientes(apodo);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
