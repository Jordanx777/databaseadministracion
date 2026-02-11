<?php
namespace App\Models;
use App\Config\Database;
use PDO;

class ProductosModel {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::connect();
    }

    public function getAllProductos() {
        $stmt = $this->pdo->prepare("
            SELECT 
                p.*,
                c.nombre as categoria_nombre,
                s.nombre as subcategoria_nombre,
                m.nombre as marca_nombre,
                pr.nombre as proveedor_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            ORDER BY p.created_at DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getProductoById($id) {
        $stmt = $this->pdo->prepare("SELECT 
                p.*,
                c.nombre as categoria_nombre,
                s.nombre as subcategoria_nombre,
                m.nombre as marca_nombre,
                pr.nombre as proveedor_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            WHERE p.id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function createProducto($data) {
        $stmt = $this->pdo->prepare("
            INSERT INTO productos (
                nombre, categoria_id, subcategoria_id, marca_id, proveedor_id,
                talla, color, genero, stock, precio_compra, precio_venta, imagen_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $resultado = $stmt->execute([
            $data['nombre'],
            $data['categoria_id'],
            $data['subcategoria_id'] ?? null,
            $data['marca_id'],
            $data['proveedor_id'],
            $data['talla'],
            $data['color'],
            $data['genero'] ?? null,
            $data['stock'],
            $data['precio_compra'],
            $data['precio_venta'],
            $data['imagen_url'] ?? null
        ]);

        return $resultado ? $this->pdo->lastInsertId() : false;
    }

    public function updateProducto($id, $data) {
        $campos = [];
        $valores = [];

        foreach ($data as $campo => $valor) {
            $campos[] = "$campo = ?";
            $valores[] = $valor;
        }

        $valores[] = $id;
        $sql = "UPDATE productos SET " . implode(', ', $campos) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($valores);
    }
    // Métodos adicionales útiles
    public function getProductosPorCategoria($categoriaId) {
        $sql = "
            SELECT 
                p.*,
                c.nombre as categoria_nombre,
                s.nombre as subcategoria_nombre,
                m.nombre as marca_nombre,
                pr.nombre as proveedor_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            WHERE p.categoria_id = ?
            ORDER BY p.created_at DESC
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$categoriaId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

     public function deleteProducto($id) {
        $stmt = $this->pdo->prepare("DELETE FROM productos WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function getProductosConBajoStock($limite = 5) {
        $sql = "
            SELECT 
                p.*,
                c.nombre as categoria_nombre,
                s.nombre as subcategoria_nombre,
                m.nombre as marca_nombre,
                pr.nombre as proveedor_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
            WHERE p.stock <= ?
            ORDER BY p.stock ASC
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$limite]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
?>