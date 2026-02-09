CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    -- codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    -- descripcion TEXT,
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    subcategoria_id INT REFERENCES subcategorias(id) ON DELETE SET NULL, -- NUEVA
    marca_id INT REFERENCES marcas(id) ON DELETE SET NULL,
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    talla VARCHAR(20),
    color VARCHAR(50),
    genero VARCHAR(20),
    imagen_url TEXT,
    estado VARCHAR(20) DEFAULT 'disponible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_productos_marca ON productos(marca_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_subcategoria ON productos(subcategoria_id); -- NUEVO
CREATE INDEX idx_productos_nombre ON productos(nombre);