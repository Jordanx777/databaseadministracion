-- Subcategorías de Ropa Hombre
INSERT INTO subcategorias (categoria_id, nombre, descripcion, orden) VALUES
    ((SELECT id FROM categorias WHERE nombre = 'Ropa Hombre'), 'Suéteres', 'Suéteres y hoodies', 1),
    -- ((SELECT id FROM categorias WHERE nombre = 'Ropa Hombre'), 'Conjuntos', 'Conjuntos deportivos completos', 2),
    -- ((SELECT id FROM categorias WHERE nombre = 'Ropa Hombre'), 'Camisas', 'Camisas y franelas', 3),
    -- ((SELECT id FROM categorias WHERE nombre = 'Ropa Hombre'), 'Pantalonetas', 'Pantalonetas y shorts', 4),
    -- ((SELECT id FROM categorias WHERE nombre = 'Ropa Hombre'), 'Pantalones', 'Pantalones casuales y deportivos', 5)
ON CONFLICT (categoria_id, nombre) DO NOTHING;