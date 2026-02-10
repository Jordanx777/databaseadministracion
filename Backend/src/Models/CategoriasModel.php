<?php
namespace App\Models;
use App\Config\Database;
use PDO;

class CategoriasModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    public function getAllCategorias(): array {
        try {
            $stmt = $this->db->query("SELECT * FROM categorias WHERE activo = true ORDER BY id");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    public function getCategoriaById(int $id): ?array {
        try {
            $stmt = $this->db->prepare("SELECT * FROM categorias WHERE id_categoria = :id AND activo = true");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    public function createCategoria(array $data): ?int {
        try {
            $sql = "INSERT INTO categorias (nombre, descripcion) 
                    VALUES (:nombre, :descripcion) 
                    RETURNING id_categoria";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null
            ]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id_categoria'] ?? null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al crear la categoría: " . $e->getMessage());
        }
    }

    public function updateCategoria(int $id, array $data): bool {
        try {
            // Verificar si la categoría existe y está activa
            if (!$this->getCategoriaById($id)) {
                throw new \Exception("Categoría no encontrada o inactiva.");
            }
            // Construir la consulta de actualización dinámicamente
            $fields = [];
            if (isset($data['nombre'])) {
                $fields[] = "nombre = :nombre";
            }
            if (isset($data['descripcion'])) {
                $fields[] = "descripcion = :descripcion";
            }
            if (empty($fields)) {
                throw new \Exception("No se proporcionaron campos para actualizar.");
            }
            $sql = "UPDATE categorias SET " . implode(", ", $fields) . " WHERE id_categoria = :id";
            $stmt = $this->db->prepare($sql);
            $params = ['id' => $id];
            if (isset($data['nombre'])) {
                $params['nombre'] = $data['nombre'];
            }
            if (isset($data['descripcion'])) {
                $params['descripcion'] = $data['descripcion'];
            }
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            throw new \Exception("Error al actualizar la categoría: " . $e->getMessage());
        }
    }

    public function deleteCategoria(int $id): bool {
        try {
            $stmt = $this->db->prepare("UPDATE categorias SET activo = false WHERE id_categoria = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al eliminar la categoría: " . $e->getMessage());
        }
    }
}