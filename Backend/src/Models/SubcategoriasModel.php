<?php
namespace App\Models;
use App\Config\Database;
use PDO;

class SubcategoriasModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    public function getAllSubcategorias(): array {
        try {
            $stmt = $this->db->query("SELECT * FROM subcategorias WHERE activo = true ORDER BY id");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    public function getSubcategoriaById(int $id): ?array {
        try {
            $stmt = $this->db->prepare("SELECT * FROM subcategorias WHERE id = :id AND activo = true");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    public function createSubcategoria(array $data): ?int {
        try {
            $sql = "INSERT INTO subcategorias (nombre, descripcion) 
                    VALUES (:nombre, :descripcion) 
                    RETURNING id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null
            ]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id_subcategoria'] ?? null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al crear la subcategoría: " . $e->getMessage());
        }
    }

    public function updateSubcategoria(int $id, array $data): bool {
        try {
            // Verificar si la subcategoría existe y está activa
            if (!$this->getSubcategoriaById($id)) {
                throw new \Exception("Subcategoría no encontrada o inactiva.");
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
                $sql = "UPDATE subcategorias SET " . implode(', ', $fields) . " WHERE id = :id";
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
}

?>