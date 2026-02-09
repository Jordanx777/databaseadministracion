-- Tabla de Categorías principales
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(50), -- Opcional: nombre del icono para UI
    orden INT DEFAULT 0, -- Para ordenar en el frontend
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_categorias_activo ON categorias(activo);

-- Vista para productos con categoría y subcategoría
-- CREATE VIEW productos_completo AS
-- SELECT 
--     p.*,
--     c.nombre as categoria_nombre,
--     s.nombre as subcategoria_nombre,
--     m.nombre as marca_nombre,
--     prov.nombre as proveedor_nombre
-- FROM productos p
-- LEFT JOIN categorias c ON p.categoria_id = c.id
-- LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
-- LEFT JOIN marcas m ON p.marca_id = m.id
-- LEFT JOIN proveedores prov ON p.proveedor_id = prov.id;