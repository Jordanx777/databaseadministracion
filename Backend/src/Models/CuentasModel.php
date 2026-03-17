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
    // ── Cuentas por cobrar con paginación y búsqueda ──────
    public function getCuentasPorCobrar(array $filtros = []): array
    {
        $page    = max(1, (int) ($filtros['page']     ?? 1));
        $perPage = max(1, (int) ($filtros['per_page'] ?? 10));
        $offset  = ($page - 1) * $perPage;
 
        $where  = ['1=1'];
        $params = [];
 
        if (!empty($filtros['buscar'])) {
            $where[]  = "(nombre ILIKE :buscar OR apodo ILIKE :buscar OR telefono ILIKE :buscar OR referencia ILIKE :buscar)";
            $params[':buscar'] = '%' . $filtros['buscar'] . '%';
        }
 
        if (!empty($filtros['tipo_cliente'])) {
            $where[]  = "tipo_cliente = :tipo_cliente";
            $params[':tipo_cliente'] = $filtros['tipo_cliente'];
        }
 
        if (!empty($filtros['mora'])) {
            if ($filtros['mora'] === 'baja')   { $where[] = "dias_mora <= 7";           }
            if ($filtros['mora'] === 'media')  { $where[] = "dias_mora > 7 AND dias_mora <= 30"; }
            if ($filtros['mora'] === 'alta')   { $where[] = "dias_mora > 30";           }
        }
 
        $whereStr = implode(' AND ', $where);
 
        // Total y estadísticas globales
        $countSql  = "SELECT 
                        COUNT(*)                          AS total,
                        COALESCE(SUM(saldo_pendiente), 0) AS total_deuda
                      FROM cuentas_por_cobrar WHERE $whereStr";
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $stats = $countStmt->fetch(PDO::FETCH_ASSOC);
 
        // Datos paginados
        $sql  = "SELECT * FROM cuentas_por_cobrar WHERE $whereStr ORDER BY dias_mora DESC, saldo_pendiente DESC";
        $stmt = $this->db->prepare($sql . " LIMIT :limit OFFSET :offset");
 
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
        $stmt->execute();
 
        return [
            'data'        => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total'       => (int)   $stats['total'],
            'page'        => $page,
            'per_page'    => $perPage,
            'last_page'   => (int) ceil((int) $stats['total'] / $perPage),
            'total_deuda' => (float) $stats['total_deuda'],
        ];
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
