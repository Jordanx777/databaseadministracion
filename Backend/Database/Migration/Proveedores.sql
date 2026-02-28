-- Proveedores/Containers
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    observaciones TEXT,
    nit VARCHAR(20) UNIQUE NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    ciudad VARCHAR(50),
    estado BOOLEAN DEFAULT TRUE,
    -- fecha_llegada DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);