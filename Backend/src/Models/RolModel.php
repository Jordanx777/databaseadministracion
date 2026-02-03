<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class RolModel {
    
    private PDO $db;
    
    // Constructor: se ejecuta automáticamente al crear la instancia
    public function __construct() {
        $this->db = Database::connect();
    }
    
    // Obtener todos los roles
    public function getAllRoles(): array {
        try {
            $stmt = $this->db->query("SELECT * FROM rol WHERE activo = true ORDER BY id_rol");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }
    
    // Obtener un rol por ID
    public function getRolById(int $id): ?array {
        try {
            $stmt = $this->db->prepare("SELECT * FROM rol WHERE id_rol = :id AND activo = true");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result ?: null;
            
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }
    
    // Crear un nuevo rol
    public function createRol(array $data): ?int {
        try {
            $sql = "INSERT INTO rol (nombre, descripcion, permisos) 
                    VALUES (:nombre, :descripcion, :permisos) 
                    RETURNING id_rol";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'permisos' => isset($data['permisos']) ? json_encode($data['permisos']) : null
            ]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id_rol'] ?? null;
            
        } catch (\PDOException $e) {
            throw new \Exception("Error al crear el rol: " . $e->getMessage());
        }
    }
    
    // Actualizar un rol
    public function updateRol(int $id, array $data): bool {
        try {
            $sql = "UPDATE rol 
                    SET nombre = :nombre, 
                        descripcion = :descripcion, 
                        permisos = :permisos,
                        fecha_actualizacion = CURRENT_TIMESTAMP
                    WHERE id_rol = :id";
            
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'id' => $id,
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'permisos' => isset($data['permisos']) ? json_encode($data['permisos']) : null
            ]);
            
        } catch (\PDOException $e) {
            throw new \Exception("Error al actualizar el rol: " . $e->getMessage());
        }
    }
    
    // Eliminar un rol (soft delete)
    public function deleteRol(int $id): bool {
        try {
            $stmt = $this->db->prepare("UPDATE rol SET activo = false WHERE id_rol = :id");
            return $stmt->execute(['id' => $id]);
            
        } catch (\PDOException $e) {
            throw new \Exception("Error al eliminar el rol: " . $e->getMessage());
        }
    }
}