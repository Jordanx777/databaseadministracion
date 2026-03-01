<?php
// Backend/src/Models/CategoriasModel.php

namespace App\Models;
use App\Config\Database;
use PDO;

class CategoriasModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    /**
     * Obtener todas las categorías activas
     */
    public function getAllCategorias(): array {
        try {
            $stmt = $this->db->query("
                SELECT * FROM categorias 
                WHERE activo = true 
                ORDER BY orden, id
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    /**
     * Obtener una categoría por ID
     * ✅ CORREGIDO: Usar 'id' en lugar de 'id_categoria'
     */
    public function getCategoriaById(int $id): ?array {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM categorias 
                WHERE id = :id 
                  AND activo = true
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    /**
     * Crear una nueva categoría
     * ✅ CORREGIDO: RETURNING id (no id_categoria)
     */
    public function createCategoria(array $data): ?int {
        try {
            $sql = "INSERT INTO categorias (nombre, descripcion, icono, orden) 
                    VALUES (:nombre, :descripcion, :icono, :orden) 
                    RETURNING id";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'icono' => $data['icono'] ?? null,
                'orden' => $data['orden'] ?? 0
            ]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id'] ?? null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al crear la categoría: " . $e->getMessage());
        }
    }

    /**
     * Actualizar una categoría
     * ✅ CORREGIDO: WHERE id (no id_categoria)
     */
    public function updateCategoria(int $id, array $data): bool {
        try {
            // Verificar si la categoría existe
            if (!$this->getCategoriaById($id)) {
                throw new \Exception("Categoría no encontrada o inactiva.");
            }

            // Construir la consulta dinámicamente
            $fields = [];
            $params = ['id' => $id];

            if (isset($data['nombre'])) {
                $fields[] = "nombre = :nombre";
                $params['nombre'] = $data['nombre'];
            }
            if (isset($data['descripcion'])) {
                $fields[] = "descripcion = :descripcion";
                $params['descripcion'] = $data['descripcion'];
            }
            if (isset($data['icono'])) {
                $fields[] = "icono = :icono";
                $params['icono'] = $data['icono'];
            }
            if (isset($data['orden'])) {
                $fields[] = "orden = :orden";
                $params['orden'] = $data['orden'];
            }

            if (empty($fields)) {
                throw new \Exception("No se proporcionaron campos para actualizar.");
            }

            // Agregar updated_at
            $fields[] = "updated_at = CURRENT_TIMESTAMP";

            $sql = "UPDATE categorias SET " . implode(", ", $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            throw new \Exception("Error al actualizar la categoría: " . $e->getMessage());
        }
    }

    /**
     * Eliminar una categoría (soft delete)
     * ✅ CORREGIDO: WHERE id (no id_categoria)
     */
    public function deleteCategoria(int $id): bool {
        try {
            // Verificar si la categoría existe
            if (!$this->getCategoriaById($id)) {
                throw new \Exception("Categoría no encontrada.");
            }

            $stmt = $this->db->prepare("
                UPDATE categorias 
                SET activo = false, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = :id
            ");
            
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al eliminar la categoría: " . $e->getMessage());
        }
    }
}