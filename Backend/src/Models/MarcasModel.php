<?php
namespace App\Models;
use App\Config\Database;
use PDO;

class MarcasModel {
    private $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    public function getAllMarcas(): array {
        try {
            $stmt = $this->db->query("SELECT * FROM marcas ORDER BY id");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }
    public function getMarcaById(int $id): ?array {
        try {
            $stmt = $this->db->prepare("SELECT * FROM marcas WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }
    public function createMarca(array $data): ?int {
        try {
            $sql = "INSERT INTO marcas (nombre, descripcion) 
                    VALUES (:nombre, :descripcion) 
                    RETURNING id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null
            ]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id_marca'] ?? null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al crear la marca: " . $e->getMessage());
        }
    }
    public function updateMarca(int $id, array $data): bool {
        try {
            // Verificar si la marca existe y está activa
            if (!$this->getMarcaById($id)) {
                throw new \Exception("Marca no encontrada o inactiva.");
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
            $sql = "UPDATE marcas SET " . implode(", ", $fields) . " WHERE id = :id";
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
            throw new \Exception("Error al actualizar la marca: " . $e->getMessage());
        }
    }
    public function deleteMarca(int $id): bool {
        try {
            // Verificar si la marca existe y está activa
            if (!$this->getMarcaById($id)) {
                throw new \Exception("Marca no encontrada o inactiva.");
            }
            $stmt = $this->db->prepare("UPDATE marcas SET activo = false WHERE id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al eliminar la marca: " . $e->getMessage());
        }   
    }

}
?>