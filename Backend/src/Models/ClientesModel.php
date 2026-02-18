<?php

namespace App\Models;

use App\Config\Database;
use PDO;
use Exception;

class ClientesModel
{
    private $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    // Métodos para interactuar con la base de datos (CRUD)
    // Ejemplo:
    public function getAll()
    {
        try {
            $stmt = $this->db->query("SELECT * FROM clientes");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error al obtener clientes: " . $e->getMessage());
            return [];
        }
    }
    public function create($nombre, $apodo, $telefono, $direccion, $referencias, $limite_credito, $tipo)
    {
        try {
            $stmt = $this->db->prepare("INSERT INTO clientes (nombre, apodo, telefono, direccion, referencia, limite_credito, tipo) VALUES (:nombre, :apodo, :telefono, :direccion, :referencias, :limite_credito, :tipo)");
            return $stmt->execute([
                ':nombre' => $nombre,
                ':apodo' => $apodo,
                ':telefono' => $telefono,
                ':direccion' => $direccion,
                ':referencias' => $referencias,
                ':limite_credito' => $limite_credito,
                ':tipo' => $tipo
            ]);
        } catch (Exception $e) {
            error_log("Error al crear cliente: " . $e->getMessage());
            return false;
        }
    }

    public function update($id, $nombre, $apodo, $telefono, $direccion, $referencias, $limite_credito, $tipo)
    {
        try {
            $stmt = $this->db->prepare("UPDATE clientes SET nombre = :nombre, apodo = :apodo, telefono = :telefono, direccion = :direccion, referencia = :referencias, limite_credito = :limite_credito, tipo = :tipo WHERE id = :id");
            return $stmt->execute([
                ':id' => $id,
                ':nombre' => $nombre,
                ':apodo' => $apodo,
                ':telefono' => $telefono,
                ':direccion' => $direccion,
                ':referencias' => $referencias,
                ':limite_credito' => $limite_credito,
                ':tipo' => $tipo
            ]);
        } catch (Exception $e) {
            error_log("Error al actualizar cliente: " . $e->getMessage());
            return false;
        }
    }


    public function delete($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM clientes WHERE id = :id");
            return $stmt->execute([':id' => $id]);
        } catch (Exception $e) {
            error_log("Error al eliminar cliente: " . $e->getMessage());
            return false;
        }
    }
}
