INSERT INTO categorias (nombre, descripcion, orden) VALUES
    ('Ropa Hombre', 'Ropa y accesorios para hombre', 1),
    -- ('Ropa Mujer', 'Ropa y accesorios para mujer', 2),
    -- ('Ropa Niños', 'Ropa infantil', 3),
    -- ('Calzado', 'Zapatos y tenis', 4),
    -- ('Accesorios', 'Gorras, pavas y otros', 5)
ON CONFLICT (nombre) DO NOTHING;