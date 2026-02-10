<?php
namespace App\Models;
use App\Config\Database;
use PDO;

class ProveedoresModel {
    private $db;

     public function __construct() {
        $this->db = Database::connect();
    }

    public function getAllProveedores(): array {
        try {
            $stmt = $this->db->query("SELECT * FROM proveedores ORDER BY id");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            throw new \Exception("Error en la base de datos: " . $e->getMessage());
        }
    }

    // Aquí puedes agregar métodos para obtener un proveedor por ID, crear, actualizar y eliminar proveedores
}
?>