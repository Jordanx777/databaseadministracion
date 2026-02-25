<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class CuentasModel
{
    private $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    // 1. Listar todas las cuentas por cobrar
    // error en esta 
    public function getCuentasPorCobrar()
    {
        $stmt = $this->db->prepare("SELECT * FROM cuentas_por_cobrar");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 2. Listar solo las cuentas activas
    public function getCuentasActivas()
    {
        $stmt = $this->db->prepare("SELECT * FROM cuentas_por_cobrar WHERE estado = 'activa'");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    //  AND estado = 'activa'
    // 3. Obtener deuda de un cliente registrado
    public function getDeudaClienteRegistrado($clienteId)
    {
        $stmt = $this->db->prepare("SELECT * FROM cuentas_por_cobrar WHERE cliente_id = :clienteId");
        $stmt->bindParam(':clienteId', $clienteId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 4. Buscar deuda de cliente ocasional por nombre
    public function buscarDeudaClienteOcasional($nombre)
    {
        $stmt = $this->db->prepare("SELECT * FROM cuentas_por_cobrar WHERE cliente_ocacional_nombre LIKE :nombre AND estado = 'activa'");
        $likeNombre = '%' . $nombre . '%';
        $stmt->bindParam(':nombre', $likeNombre, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Método para historial ACTIVO (sin canceladas)
    public function getHistorialClienteActivas($clienteId)
    {
        $stmt = $this->db->prepare("
        SELECT 
            venta_id,
            numero_factura,
            fecha_venta,
            cliente_id,
            cliente_nombre,
            monto_venta,
            tipo_pago,
            estado_venta,
            total_pagado,
            saldo_pendiente,
            productos,
            pagos
        FROM historial_cliente_activas 
        WHERE cliente_id = :clienteId
        ORDER BY fecha_venta DESC
    ");
        $stmt->bindParam(':clienteId', $clienteId, PDO::PARAM_INT);
        $stmt->execute();

        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decodificar JSON de productos y pagos
        foreach ($resultados as &$resultado) {
            $resultado['productos'] = !empty($resultado['productos'])
                ? json_decode($resultado['productos'], true)
                : [];
            $resultado['pagos'] = !empty($resultado['pagos'])
                ? json_decode($resultado['pagos'], true)
                : [];
        }

        return $resultados;
    }

    // 5. Obtener historial completo de un cliente
    public function getHistorialCliente($clienteId)
    {
        $stmt = $this->db->prepare("
        SELECT 
            venta_id,
            numero_factura,
            fecha_venta,
            cliente_id,
            cliente_nombre,
            monto_venta,
            tipo_pago,
            estado_venta,
            total_pagado,
            saldo_pendiente,
            productos,
            pagos
        FROM historial_cliente 
        WHERE cliente_id = :clienteId
        ORDER BY fecha_venta DESC
    ");
        $stmt->bindParam(':clienteId', $clienteId, PDO::PARAM_INT);
        $stmt->execute();

        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decodificar JSON de productos y pagos
        foreach ($resultados as &$resultado) {
            // $resultado['productos'] = json_decode($resultado['productos'], true) ?? [];
            // $resultado['pagos'] = json_decode($resultado['pagos'], true) ?? [];
            $resultado['productos'] = !empty($resultado['productos'])
                ? json_decode($resultado['productos'], true)
                : [];
            $resultado['pagos'] = !empty($resultado['pagos'])
                ? json_decode($resultado['pagos'], true)
                : [];
        }

        return $resultados;
    }

    // 6. Obtener resumen de deuda de un cliente (total adeudado, total pagado, etc.)
    public function getResumenDeuda($clienteId)
    {
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
