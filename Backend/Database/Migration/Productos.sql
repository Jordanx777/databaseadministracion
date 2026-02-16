CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    subcategoria_id INT REFERENCES subcategorias(id) ON DELETE SET NULL, -- NUEVA
    marca_id INT REFERENCES marcas(id) ON DELETE SET NULL,
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2) NOT NULL,
    imagen_url TEXT,
    estado VARCHAR(20) DEFAULT 'disponible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Nueva tabla de variantes
CREATE TABLE producto_variantes (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    talla VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    genero VARCHAR(20),
    stock INT DEFAULT 0,
    precio_compra DECIMAL(10,2),   -- opcional: precio por variante
    precio_venta DECIMAL(10,2),    -- opcional: precio por variante
    estado VARCHAR(20) DEFAULT 'disponible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, talla, color)  -- evita duplicados
);

CREATE INDEX idx_variantes_producto ON producto_variantes(producto_id);
-- Índices
CREATE INDEX idx_productos_marca ON productos(marca_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_subcategoria ON productos(subcategoria_id); -- NUEVO
CREATE INDEX idx_productos_nombre ON productos(nombre);