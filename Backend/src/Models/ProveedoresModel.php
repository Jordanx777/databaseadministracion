<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class ProveedoresModel
{
    private $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    public function getAllProveedores(): array
    {
        try {
            $stmt = $this->db->query("SELECT * FROM proveedores ORDER BY id");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    public function getProveedorById(int $id): ?array
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM proveedores WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    public function createProveedor(array $data): ?int
    {
        try {
            // Preparar datos con valores por defecto
            $nombre = $data['nombre'] ?? null;
            $nit = $data['nit'] ?? null;
            $correo = $data['correo'] ?? null;
            $observaciones = $data['observaciones'] ?? null;
            $telefono = $data['telefono'] ?? null;
            $ciudad = $data['ciudad'] ?? null;

            $sql = "INSERT INTO proveedores (nombre, observaciones, nit, correo, telefono, ciudad, estado) 
                VALUES (:nombre, :observaciones, :nit, :correo, :telefono, :ciudad, :estado) 
                RETURNING id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'nombre' => $nombre,
                'observaciones' => $observaciones,
                'nit' => $nit,
                'correo' => $correo,
                'telefono' => $telefono,
                'ciudad' => $ciudad,
                'estado' => true,
            ]);

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id'] ?? null;
        } catch (\PDOException $e) {
            if (strpos($e->getMessage(), 'duplicate key') !== false) {
                if (strpos($e->getMessage(), 'nit') !== false) {
                    throw new \Exception("El NIT ya está registrado");
                }
                // si 
                if (strpos($e->getMessage(), 'correo') !== false) {
                    throw new \Exception("El correo electrónico ya está registrado");
                }
            }
            throw new \Exception("Error al crear el proveedor: " . $e->getMessage());
        }
    }

    public function updateProveedor(int $id, array $data): bool
    {
        try {
            // Verificar si el proveedor existe
            if (!$this->getProveedorById($id)) {
                throw new \Exception("Proveedor no encontrado.");
            }



            // Construir la consulta de actualización dinámicamente
            $fields = [];
            $params = ['id' => $id];

            if (isset($data['nombre'])) {
                $fields[] = "nombre = :nombre";
                $params['nombre'] = $data['nombre'];
            }
            if (isset($data['observaciones'])) {
                $fields[] = "observaciones = :observaciones";
                $params['observaciones'] = $data['observaciones'];
            }
            if (isset($data['nit'])) {
                $fields[] = "nit = :nit";
                $params['nit'] = $data['nit'];
            }
            if (isset($data['correo'])) {
                $fields[] = "correo = :correo";
                $params['correo'] = $data['correo'];
            }
            if (isset($data['telefono'])) {
                $fields[] = "telefono = :telefono";
                $params['telefono'] = $data['telefono'];
            }
            if (isset($data['ciudad'])) {
                $fields[] = "ciudad = :ciudad";
                $params['ciudad'] = $data['ciudad'];
            }
            if (isset($data['estado']) && $data['estado'] !== '') {
                $fields[] = "estado = :estado";
                $params['estado'] = filter_var($data['estado'], FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
            }

            if (empty($fields)) {
                throw new \Exception("No se proporcionaron campos para actualizar.");
            }

            $sql = "UPDATE proveedores SET " . implode(", ", $fields) . " WHERE id = :id";
            error_log("SQL Update: " . $sql); // Log para depuración
            error_log("Params: " . print_r($params, true)); // Log para depuración
            $stmt = $this->db->prepare($sql);

            return $stmt->execute($params);
        } catch (\PDOException $e) {
            throw new \Exception("Error al actualizar el proveedor: " . $e->getMessage());
        }
    }

    public function deleteProveedor(int $id): bool
    {
        try {
            // Verificar si el proveedor existe
            if (!$this->getProveedorById($id)) {
                throw new \Exception("Proveedor no encontrado.");
            }

            // Cambiar estado a false en lugar de eliminar físicamente
            $stmt = $this->db->prepare("UPDATE proveedores SET estado = false WHERE id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al eliminar el proveedor: " . $e->getMessage());
        }
    }

    public function getProveedoresActivos(): array
    {
        try {
            $stmt = $this->db->query("SELECT * FROM proveedores WHERE estado = true ORDER BY nombre");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }
}
