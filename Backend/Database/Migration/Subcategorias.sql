-- Tabla de Subcategorías
CREATE TABLE subcategorias (
    id SERIAL PRIMARY KEY,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(categoria_id, nombre) -- No permitir nombres duplicados dentro de la misma categoría
);

-- Índices
CREATE INDEX idx_subcategorias_categoria ON subcategorias(categoria_id);
CREATE INDEX idx_subcategorias_activo ON subcategorias(activo);