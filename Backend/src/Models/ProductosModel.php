<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class ProductosModel
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = Database::connect();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LECTURAS
    // ─────────────────────────────────────────────────────────────────────────

    public function getAllProductos(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                p.*,
                c.nombre  AS categoria_nombre,
                s.nombre  AS subcategoria_nombre,
                m.nombre  AS marca_nombre,
                pr.nombre AS proveedor_nombre,
                COALESCE(SUM(v.stock), 0) AS stock_total
            FROM productos p
            LEFT JOIN categorias         c  ON p.categoria_id   = c.id
            LEFT JOIN subcategorias      s  ON p.subcategoria_id = s.id
            LEFT JOIN marcas             m  ON p.marca_id        = m.id
            LEFT JOIN proveedores        pr ON p.proveedor_id    = pr.id
            LEFT JOIN producto_variantes v  ON v.producto_id     = p.id
            GROUP BY p.id, c.nombre, s.nombre, m.nombre, pr.nombre
            ORDER BY p.created_at DESC
        ");
        $stmt->execute();
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($productos as &$producto) {
            $producto['variantes'] = $this->getVariantesByProducto($producto['id']);
        }
        unset($producto);

        return $productos;
    }

    // ┌────────────────────────────────────────────────────────────────────────
    // BUSQUEDAS
    // ─────────────────────────────────────────────────────────────────────────
    public function searchProductos($query): array
    {
        $stmt = $this->pdo->prepare("
            SELECT
                p.*,
                c.nombre  AS categoria_nombre,
                s.nombre  AS subcategoria_nombre,
                m.nombre  AS marca_nombre,
                pr.nombre AS proveedor_nombre,
                COALESCE(SUM(v.stock), 0) AS stock_total
            FROM productos p
            LEFT JOIN categorias         c  ON p.categoria_id   = c.id
            LEFT JOIN subcategorias      s  ON p.subcategoria_id = s.id
            LEFT JOIN marcas             m  ON p.marca_id        = m.id
            LEFT JOIN proveedores        pr ON p.proveedor_id    = pr.id
            LEFT JOIN producto_variantes v  ON v.producto_id     = p.id
            WHERE p.nombre LIKE :query OR m.nombre LIKE :query OR c.nombre LIKE :query
            GROUP BY p.id, c.nombre, s.nombre, m.nombre, pr.nombre
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([':query' => '%' . $query . '%']);
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($productos as &$producto) {
            $producto['variantes'] = $this->getVariantesByProducto($producto['id']);
        }
        unset($producto);

        return $productos;
    }

    public function getProductoById(int $id): array|false
    {
        $stmt = $this->pdo->prepare("
            SELECT
                p.*,
                c.nombre  AS categoria_nombre,
                s.nombre  AS subcategoria_nombre,
                m.nombre  AS marca_nombre,
                pr.nombre AS proveedor_nombre
            FROM productos p
            LEFT JOIN categorias    c  ON p.categoria_id   = c.id
            LEFT JOIN subcategorias s  ON p.subcategoria_id = s.id
            LEFT JOIN marcas        m  ON p.marca_id        = m.id
            LEFT JOIN proveedores   pr ON p.proveedor_id    = pr.id
            WHERE p.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

     /** ✅ Sin genero en variantes */
    public function getVariantesByProducto(int $productoId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT id, producto_id, talla, color, stock, estado
            FROM producto_variantes
            WHERE producto_id = ?
            ORDER BY talla, color
        ");
        $stmt->execute([$productoId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREAR
    // ─────────────────────────────────────────────────────────────────────────

    
    public function createProducto(array $data, array $variantes): int|false
    {
        try {
            $this->pdo->beginTransaction();

            // ✅ Insertar producto padre CON genero
            $stmt = $this->pdo->prepare("
                INSERT INTO productos (
                    nombre, categoria_id, subcategoria_id, marca_id, proveedor_id,
                    genero, precio_compra, precio_venta, imagen_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['nombre'],
                $data['categoria_id'],
                $data['subcategoria_id'] ?? null,
                $data['marca_id'] ?? null,        // ✅ Opcional
                $data['proveedor_id'] ?? null,    // ✅ Opcional
                $data['genero'] ?? null,          // ✅ Genero en productos
                $data['precio_compra'] ?? null,   // ✅ Opcional
                $data['precio_venta'],
                $data['imagen_url'] ?? null,
            ]);

            $productoId = (int)$this->pdo->lastInsertId();

            // Insertar variantes SIN genero
            $this->insertarVariantes($productoId, $variantes);

            $this->pdo->commit();
            return $productoId;
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            error_log("Error en createProducto: " . $e->getMessage());
            return false;
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // ACTUALIZAR
    // ─────────────────────────────────────────────────────────────────────────

     public function updateProducto(int $id, array $data, ?array $variantes = null): bool
    {
        try {
            $this->pdo->beginTransaction();

            // Actualizar producto padre
            if (!empty($data)) {
                $campos = []; $valores = [];
                foreach ($data as $campo => $valor) {
                    $campos[]  = "$campo = ?";
                    $valores[] = $valor;
                }
                $valores[] = $id;
                $sql  = "UPDATE productos SET " . implode(', ', $campos) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($valores);
            }

            // Sincronizar variantes si se enviaron
            if ($variantes !== null) {
                $this->sincronizarVariantes($id, $variantes);
            }

            $this->pdo->commit();
            return true;
        } catch (\Exception $e) {
            $this->pdo->rollBack();
            error_log("Error en updateProducto: " . $e->getMessage());
            return false;
        }
    }


    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────

    public function deleteProducto(int $id): bool
    {
        // Las variantes se eliminan por ON DELETE CASCADE
        $stmt = $this->pdo->prepare("DELETE FROM productos WHERE id = ?");
        return $stmt->execute([$id]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS PRIVADOS
    // ─────────────────────────────────────────────────────────────────────────

   /** ✅ INSERT SIN genero */
    private function insertarVariantes(int $productoId, array $variantes): void
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO producto_variantes (producto_id, talla, color, stock)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (producto_id, talla, color)
            DO UPDATE SET
                stock      = EXCLUDED.stock,
                updated_at = CURRENT_TIMESTAMP
        ");

        foreach ($variantes as $v) {
            $stmt->execute([
                $productoId,
                $v['talla'],
                $v['color'],
                (int)($v['stock'] ?? 0),
            ]);
        }
    }

    /** ✅ Sincronizar SIN genero */
    private function sincronizarVariantes(int $productoId, array $variantes): void
    {
        $idsRecibidos = array_filter(
            array_column($variantes, 'id'),
            fn($id) => $id !== null && $id !== ''
        );

        if (!empty($idsRecibidos)) {
            $placeholders = implode(',', array_fill(0, count($idsRecibidos), '?'));
            $stmt = $this->pdo->prepare("
                DELETE FROM producto_variantes
                WHERE producto_id = ? AND id NOT IN ($placeholders)
            ");
            $stmt->execute(array_merge([$productoId], array_values($idsRecibidos)));
        } else {
            $stmt = $this->pdo->prepare("DELETE FROM producto_variantes WHERE producto_id = ?");
            $stmt->execute([$productoId]);
        }

        $stmtUpdate = $this->pdo->prepare("
            UPDATE producto_variantes
            SET talla = ?, color = ?, stock = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND producto_id = ?
        ");
        $stmtInsert = $this->pdo->prepare("
            INSERT INTO producto_variantes (producto_id, talla, color, stock)
            VALUES (?, ?, ?, ?)
        ");

        foreach ($variantes as $v) {
            $talla = $v['talla'];
            $color = $v['color'];
            $stock = (int)($v['stock'] ?? 0);

            if (!empty($v['id'])) {
                $stmtUpdate->execute([$talla, $color, $stock, (int)$v['id'], $productoId]);
            } else {
                $stmtInsert->execute([$productoId, $talla, $color, $stock]);
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // MÉTODOS EXTRA
    // ─────────────────────────────────────────────────────────────────────────

    public function getProductosPorCategoria(int $categoriaId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT p.*, c.nombre AS categoria_nombre, m.nombre AS marca_nombre,
                   COALESCE(SUM(v.stock), 0) AS stock_total
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas     m ON p.marca_id     = m.id
            LEFT JOIN producto_variantes v ON v.producto_id = p.id
            WHERE p.categoria_id = ?
            GROUP BY p.id, c.nombre, m.nombre
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$categoriaId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getProductosConBajoStock(int $limite = 5): array
    {
        $stmt = $this->pdo->prepare("
            SELECT p.*, c.nombre AS categoria_nombre, m.nombre AS marca_nombre,
                   COALESCE(SUM(v.stock), 0) AS stock_total
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas     m ON p.marca_id     = m.id
            LEFT JOIN producto_variantes v ON v.producto_id = p.id
            GROUP BY p.id, c.nombre, m.nombre
            HAVING COALESCE(SUM(v.stock), 0) <= ?
            ORDER BY stock_total ASC
        ");
        $stmt->execute([$limite]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}