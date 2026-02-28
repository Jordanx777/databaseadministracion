-- ============================================================================
-- TABLA PRODUCTOS (con género)
-- ============================================================================
DROP TABLE IF EXISTS producto_variantes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    subcategoria_id INT REFERENCES subcategorias(id) ON DELETE SET NULL,
    marca_id INT REFERENCES marcas(id) ON DELETE SET NULL,
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    genero VARCHAR(20), -- ✅ Género ahora está en productos
    precio_compra DECIMAL(10,2), -- ✅ Opcional
    precio_venta DECIMAL(10,2) NOT NULL,
    imagen_url TEXT,
    estado VARCHAR(20) DEFAULT 'disponible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA PRODUCTO_VARIANTES (sin género)
-- ============================================================================
CREATE TABLE producto_variantes (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    talla VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    stock INT DEFAULT 0,
    precio_compra DECIMAL(10,2),   -- opcional: precio específico por variante
    precio_venta DECIMAL(10,2),    -- opcional: precio específico por variante
    estado VARCHAR(20) DEFAULT 'disponible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, talla, color)  -- ✅ Sin género
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX idx_productos_marca ON productos(marca_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_subcategoria ON productos(subcategoria_id);
CREATE INDEX idx_productos_genero ON productos(genero); -- ✅ Nuevo índice
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_variantes_producto ON producto_variantes(producto_id);