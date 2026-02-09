-- Proveedores/Containers
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_llegada DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);