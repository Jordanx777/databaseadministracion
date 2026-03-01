<?php
// Backend/src/Models/SubcategoriasModel.php

namespace App\Models;
use App\Config\Database;
use PDO;

class SubcategoriasModel {
    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    /**
     * Obtener todas las subcategorías activas
     */
    public function getAllSubcategorias(): array {
        try {
            $stmt = $this->db->query("
                SELECT * FROM subcategorias 
                WHERE activo = true 
                ORDER BY orden, id
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    /**
     * Obtener subcategorías por ID de categoría
     * ✅ CORREGIDO: Ahora devuelve TODAS las subcategorías de una categoría
     */
    public function getSubcategoriasPorCategoria(int $categoriaId): array {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM subcategorias 
                WHERE categoria_id = :categoriaId 
                  AND activo = true
                ORDER BY orden, id
            ");
            $stmt->execute(['categoriaId' => $categoriaId]);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); // ✅ fetchAll en lugar de fetch
            
            error_log("Subcategorías encontradas para categoría {$categoriaId}: " . count($result));
            
            return $result;
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    /**
     * Obtener una subcategoría por su ID
     * ✅ NUEVO: Método separado para obtener UNA subcategoría por su propio ID
     */
    public function getSubcategoriaById(int $id): ?array {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM subcategorias 
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
     * Crear una nueva subcategoría
     */
    public function createSubcategoria(array $data): ?int {
        try {
            $sql = "INSERT INTO subcategorias (categoria_id, nombre, descripcion) 
                    VALUES (:categoria_id, :nombre, :descripcion) 
                    RETURNING id";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'categoria_id' => $data['categoria_id'],
                'nombre' => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null
            ]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id'] ?? null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al crear la subcategoría: " . $e->getMessage());
        }
    }

    /**
     * Actualizar una subcategoría
     */
    public function updateSubcategoria(int $id, array $data): bool {
        try {
            // ✅ CORREGIDO: Verificar por ID de subcategoría
            if (!$this->getSubcategoriaById($id)) {
                throw new \Exception("Subcategoría no encontrada o inactiva.");
            }

            // Construir la consulta de actualización dinámicamente
            $fields = [];
            $params = ['id' => $id];

            if (isset($data['categoria_id'])) {
                $fields[] = "categoria_id = :categoria_id";
                $params['categoria_id'] = $data['categoria_id'];
            }
            if (isset($data['nombre'])) {
                $fields[] = "nombre = :nombre";
                $params['nombre'] = $data['nombre'];
            }
            if (isset($data['descripcion'])) {
                $fields[] = "descripcion = :descripcion";
                $params['descripcion'] = $data['descripcion'];
            }

            if (empty($fields)) {
                throw new \Exception("No se proporcionaron campos para actualizar.");
            }

            $sql = "UPDATE subcategorias SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            throw new \Exception("Error al actualizar la subcategoría: " . $e->getMessage());
        }
    }

    /**
     * Eliminar una subcategoría (soft delete)
     */
    public function deleteSubcategoria(int $id): bool {
        try {
            // ✅ CORREGIDO: Verificar por ID de subcategoría
            if (!$this->getSubcategoriaById($id)) {
                throw new \Exception("Subcategoría no encontrada o inactiva.");
            }

            $sql = "UPDATE subcategorias SET activo = false WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al eliminar la subcategoría: " . $e->getMessage());
        }
    }
}