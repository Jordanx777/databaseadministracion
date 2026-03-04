<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class RolesModel
{
    private $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    public function getAllRoles(): array
    {
        try {
            $stmt = $this->db->query("SELECT * FROM rol ORDER BY id_rol");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    public function getRolById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM rol WHERE id_rol = :id");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    public function createRol(array $data): ?int
    {
        try {
            $sql = "INSERT INTO rol (nombre, descripcion, activo)
                    VALUES (:nombre, :descripcion, :activo)
                    RETURNING id_rol";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'nombre'      => $data['nombre'],
                'descripcion' => $data['descripcion'] ?? null,
                'activo'      => isset($data['activo']) ? (bool) $data['activo'] : true,
            ]);

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id_rol'] ?? null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al crear el rol: " . $e->getMessage());
        }
    }

    public function updateRol(int $id, array $data): bool
    {
        try {
            if (!$this->getRolById($id)) {
                throw new \Exception("Rol no encontrado.");
            }

            $fields = [];
            if (isset($data['nombre']))      $fields[] = "nombre = :nombre";
            if (array_key_exists('descripcion', $data)) $fields[] = "descripcion = :descripcion";
            if (array_key_exists('activo', $data)) $fields[] = "activo = :activo";

            if (empty($fields)) {
                throw new \Exception("No se proporcionaron campos para actualizar.");
            }

            $fields[] = "fecha_actualizacion = NOW()";

            $sql  = "UPDATE rol SET " . implode(", ", $fields) . " WHERE id_rol = :id";
            $stmt = $this->db->prepare($sql);

            $params = ['id' => $id];
            if (isset($data['nombre']))      $params['nombre']      = $data['nombre'];
            if (array_key_exists('descripcion', $data)) $params['descripcion'] = $data['descripcion'];
            if (isset($data['activo'])) {
                // Normaliza cualquier valor a boolean real para PostgreSQL
                $activo = $data['activo'];
                if ($activo === '' || $activo === null) {
                    $params['activo'] = false;
                } elseif (is_string($activo)) {
                    $params['activo'] = filter_var($activo, FILTER_VALIDATE_BOOLEAN);
                } else {
                    $params['activo'] = (bool) $activo;
                }
            }

            return $stmt->execute($params);
        } catch (\PDOException $e) {
            throw new \Exception("Error al actualizar el rol: " . $e->getMessage());
        }
    }

    public function deleteRol(int $id): bool
    {
        try {
            if (!$this->getRolById($id)) {
                throw new \Exception("Rol no encontrado.");
            }

            // Soft delete: marca como inactivo en lugar de eliminar físicamente
            $stmt = $this->db->prepare(
                "UPDATE rol SET activo = false, fecha_actualizacion = NOW() WHERE id_rol = :id"
            );
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al eliminar el rol: " . $e->getMessage());
        }
    }
}