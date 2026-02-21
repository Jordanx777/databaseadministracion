<?php
namespace App\Models;
use App\Config\Database;
use PDO;

class CuentasModel {
    private $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    // 1. Listar todas las cuentas por cobrar
    public function getCuentasPorCobrar() {
        $stmt = $this->db->prepare("SELECT * FROM cuentas_por_cobrar");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 2. Listar solo las cuentas activas
    public function getCuentasActivas() {
        $stmt = $this->db->prepare("SELECT * FROM cuentas_por_cobrar WHERE estado = 'activa'");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 3. Obtener deuda de un cliente registrado
    public function getDeudaClienteRegistrado($clienteId) {
        $stmt = $this->db->prepare("SELECT * FROM cuentas_por_cobrar WHERE cliente_id = :clienteId AND estado = 'activa'");
        $stmt->bindParam(':clienteId', $clienteId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 4. Buscar deuda de cliente ocasional por nombre
    public function buscarDeudaClienteOcasional($nombre) {
        $stmt = $this->db->prepare("SELECT * FROM cuentas_por_cobrar WHERE cliente_ocacional_nombre LIKE :nombre AND estado = 'activa'");
        $likeNombre = '%' . $nombre . '%';
        $stmt->bindParam(':nombre', $likeNombre, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 5. Obtener historial completo de un cliente
    public function getHistorialCliente($clienteId) {
        $stmt = $this->db->prepare("SELECT * FROM cuentas_por_cobrar WHERE cliente_id = :clienteId");
        $stmt->bindParam(':clienteId', $clienteId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 6. Obtener resumen de deuda de un cliente (total adeudado, total pagado, etc.)
    public function getResumenDeuda($clienteId) {
        $stmt = $this->db->prepare("SELECT 
            SUM(monto_total) AS total_adeudado, 
            SUM(monto_pagado) AS total_pagado, 
            (SUM(monto_total) - SUM(monto_pagado)) AS saldo_pendiente
            FROM cuentas_por_cobrar 
            WHERE cliente_id = :clienteId");
        $stmt->bindParam(':clienteId', $clienteId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }   
}
        //
?>