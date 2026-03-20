<?php
// Backend/src/Models/VentasModel.php

namespace App\Models;

use App\Config\Database;
use PDO;
use PDOException;

class VentasModel
{
    private $conn;
    private $table = 'ventas';

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function obtenerPorVenta($ventaId)
    {
        $sql = "SELECT 
                    p.*,
                    u.nombre as registrado_por_nombre
                FROM pagos p
                LEFT JOIN usuario u ON p.registrado_por = u.id_usuario
                WHERE p.venta_id = ?
                ORDER BY p.fecha_pago DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$ventaId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ── Validar límite de crédito ─────────────────────────
    private function validarLimiteCredito(int $clienteId, float $montoCredito): void
    {
        $stmt = $this->conn->prepare("
            SELECT limite_credito FROM clientes WHERE id = :id
        ");
        $stmt->execute(['id' => $clienteId]);
        $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$cliente) {
            throw new \Exception("Cliente no encontrado.");
        }

        $limite = (float) $cliente['limite_credito'];

        if ($limite <= 0) {
            throw new \Exception(
                "Este cliente no tiene límite de crédito configurado. " .
                    "Contacte al administrador para establecer un límite."
            );
        }

        // Deuda actual = sum de saldos pendientes en ventas activas
        $stmt = $this->conn->prepare("
            SELECT COALESCE(SUM(saldo_pendiente), 0) AS deuda_actual
            FROM ventas_completas
            WHERE cliente_id    = :id
              AND venta_estado != 'cancelada'
              AND saldo_pendiente > 0
        ");
        $stmt->execute(['id' => $clienteId]);
        $resultado   = $stmt->fetch(PDO::FETCH_ASSOC);
        $deudaActual = (float) $resultado['deuda_actual'];
        $disponible  = $limite - $deudaActual;

        if ($montoCredito > $disponible) {
            $fmt = fn($n) => '$' . number_format($n, 0, ',', '.');
            throw new \Exception(
                "Crédito insuficiente para este cliente. " .
                    "Límite: {$this->fmt($limite)} | " .
                    "Deuda actual: {$this->fmt($deudaActual)} | " .
                    "Disponible: {$this->fmt($disponible)}"
            );
        }
    }

    private function fmt(float $n): string
    {
        return '$' . number_format($n, 0, ',', '.');
    }

    // ── Obtener crédito disponible de un cliente ──────────
    public function getCreditoDisponible(int $clienteId): array
    {
        $stmt = $this->conn->prepare("SELECT limite_credito FROM clientes WHERE id = :id");
        $stmt->execute(['id' => $clienteId]);
        $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$cliente) return ['limite' => 0, 'deuda' => 0, 'disponible' => 0];

        $limite = (float) $cliente['limite_credito'];

        $stmt = $this->conn->prepare("
            SELECT COALESCE(SUM(saldo_pendiente), 0) AS deuda_actual
            FROM ventas_completas
            WHERE cliente_id    = :id
              AND venta_estado != 'cancelada'
              AND saldo_pendiente > 0
        ");
        $stmt->execute(['id' => $clienteId]);
        $deuda = (float) $stmt->fetch(PDO::FETCH_ASSOC)['deuda_actual'];

        return [
            'limite'     => $limite,
            'deuda'      => $deuda,
            'disponible' => max(0, $limite - $deuda),
        ];
    }

    // ── Crear venta ───────────────────────────────────────
    public function crear($data)
    {
        $this->conn->beginTransaction();

        try {
            $numero_factura = $this->generarNumeroFactura();
            $usuario_id     = $data['usuario_id'] ?? 1;

            // Validar crédito para ventas a crédito o mixtas
            if (in_array($data['tipo_pago'], ['credito', 'mixto']) && !empty($data['cliente_id'])) {
                if ($data['tipo_pago'] === 'credito') {
                    $montoCredito = (float) $data['total'];
                } else {
                    // Mixto: crédito = total - lo que ya paga ahora
                    $totalPagos   = array_sum(array_column($data['pagos'] ?? [], 'monto'));
                    $montoCredito = max(0, (float) $data['total'] - $totalPagos);
                }
                if ($montoCredito > 0) {
                    $this->validarLimiteCredito((int) $data['cliente_id'], $montoCredito);
                }
            }

            // Validar que crédito tenga cliente registrado
            if ($data['tipo_pago'] === 'credito' && empty($data['cliente_id'])) {
                throw new \Exception('Las ventas a crédito requieren un cliente registrado.');
            }

            // Determinar estado inicial
            $estado = 'pendiente';
            if ($data['tipo_pago'] === 'contado') {
                $estado = 'pagada';
            } elseif ($data['tipo_pago'] === 'mixto' && !empty($data['pagos'])) {
                $totalPagos = array_sum(array_column($data['pagos'], 'monto'));
                if ($totalPagos >= $data['total']) $estado = 'pagada';
            }

            // Insertar VENTA
            $sql = "INSERT INTO ventas (
                        numero_factura, cliente_id, cliente_nombre,
                        cliente_telefono, cliente_referencia, usuario_id,
                        subtotal, descuento, total, tipo_pago, estado, notas
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    RETURNING id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $numero_factura,
                $data['cliente_id']          ?? null,
                $data['cliente_nombre']       ?? null,
                $data['cliente_telefono']     ?? null,
                $data['cliente_referencia']   ?? null,
                $usuario_id,
                $data['subtotal'],
                $data['descuento'],
                $data['total'],
                $data['tipo_pago'],
                $estado,
                $data['notas']               ?? null,
            ]);

            $venta_id = $stmt->fetchColumn();

            // Insertar DETALLES
            if (empty($data['detalles']) || !is_array($data['detalles'])) {
                throw new \Exception('La venta debe tener al menos un producto.');
            }
            foreach ($data['detalles'] as $detalle) {
                $this->insertarDetalle($venta_id, $detalle);
                $this->actualizarStockVariante($detalle['variante_id'], $detalle['cantidad']);
            }

            // Insertar PAGOS
            if (!empty($data['pagos']) && is_array($data['pagos'])) {
                foreach ($data['pagos'] as $pago) {
                    if ((float)$pago['monto'] > 0) {
                        $this->insertarPago($venta_id, $pago, $usuario_id);
                    }
                }
            }

            $this->conn->commit();

            return [
                'success' => true,
                'data'    => [
                    'venta_id'       => $venta_id,
                    'numero_factura' => $numero_factura,
                    'estado'         => $estado,
                    'total'          => $data['total'],
                ],
                'message' => 'Venta registrada exitosamente',
            ];
        } catch (\Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    // ── Detalle ───────────────────────────────────────────
    private function insertarDetalle($venta_id, $detalle)
    {
        $stmt = $this->conn->prepare("SELECT stock FROM producto_variantes WHERE id = ?");
        $stmt->execute([$detalle['variante_id']]);
        $variante = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$variante) {
            throw new \Exception("Variante {$detalle['variante_id']} no encontrada.");
        }
        if ($variante['stock'] < $detalle['cantidad']) {
            throw new \Exception(
                "Stock insuficiente para variante {$detalle['variante_id']}. " .
                    "Disponible: {$variante['stock']}, Solicitado: {$detalle['cantidad']}"
            );
        }

        $sql = "INSERT INTO ventas_detalle (
                    venta_id, producto_id, variante_id, cantidad,
                    precio_unitario, subtotal, talla_vendida, color_vendido
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            $venta_id,
            $detalle['producto_id'],
            $detalle['variante_id'],
            $detalle['cantidad'],
            $detalle['precio_unitario'],
            $detalle['subtotal'],
            $detalle['talla_vendida'],
            $detalle['color_vendido'],
        ]);
    }

    private function actualizarStockVariante($variante_id, $cantidad)
    {
        $stmt = $this->conn->prepare(
            "UPDATE producto_variantes SET stock = stock - ? WHERE id = ?"
        );
        $stmt->execute([$cantidad, $variante_id]);

        $stmt = $this->conn->prepare(
            "UPDATE producto_variantes SET estado = 'agotado' WHERE id = ? AND stock <= 0"
        );
        $stmt->execute([$variante_id]);
    }

    private function insertarPago($venta_id, $pago, $usuario_id)
    {
        $sql = "INSERT INTO pagos (
                    venta_id, monto, metodo_pago, referencia, notas, registrado_por
                ) VALUES (?, ?, ?, ?, ?, ?)";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            $venta_id,
            $pago['monto'],
            $pago['metodo_pago'],
            $pago['referencia'] ?? null,
            $pago['notas']      ?? null,
            $usuario_id,
        ]);
    }

    private function generarNumeroFactura(): string
    {
        $fecha = date('Ymd');
        $stmt  = $this->conn->prepare(
            "SELECT numero_factura FROM ventas WHERE numero_factura LIKE ? ORDER BY id DESC LIMIT 1"
        );
        $stmt->execute(["FAC-{$fecha}-%"]);
        $ultima = $stmt->fetch(PDO::FETCH_ASSOC);

        // ✅ Si no hay facturas previas hoy, empezar desde 1
        if (!$ultima || empty($ultima['numero_factura'])) {
            return sprintf('FAC-%s-%04d', $fecha, 1);
        }

        $partes     = explode('-', $ultima['numero_factura']);
        $secuencial = intval(end($partes)) + 1;

        return sprintf('FAC-%s-%04d', $fecha, $secuencial);
    }

    // ── Listar ────────────────────────────────────────────
    // public function obtenerVentasCompletas($filtros = [])
    // {
    //     $sql    = "SELECT * FROM ventas_completas WHERE 1=1";
    //     $params = [];

    //     if (!empty($filtros['estado'])) {
    //         $sql .= " AND venta_estado = ?";
    //         $params[] = $filtros['estado'];
    //     }
    //     if (!empty($filtros['tipo_pago'])) {
    //         $sql .= " AND tipo_pago = ?";
    //         $params[] = $filtros['tipo_pago'];
    //     }
    //     if (!empty($filtros['cliente_id'])) {
    //         $sql .= " AND cliente_id = ?";
    //         $params[] = $filtros['cliente_id'];
    //     }
    //     if (!empty($filtros['fecha_desde'])) {
    //         $sql .= " AND fecha_venta >= ?";
    //         $params[] = $filtros['fecha_desde'];
    //     }
    //     if (!empty($filtros['fecha_hasta'])) {
    //         $sql .= " AND fecha_venta <= ?";
    //         $params[] = $filtros['fecha_hasta'];
    //     }
    //     if (!empty($filtros['buscar'])) {
    //         $sql .= " AND (cliente_nombre ILIKE ? OR numero_factura ILIKE ?)";
    //         $b = "%{$filtros['buscar']}%";
    //         $params[] = $b;
    //         $params[] = $b;
    //     }

    //     $sql .= " ORDER BY fecha_venta DESC";

    //     if (!empty($filtros['limit'])) {
    //         $sql .= " LIMIT ?";
    //         $params[] = intval($filtros['limit']);
    //     }

    //     $stmt = $this->conn->prepare($sql);
    //     $stmt->execute($params);
    //     $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    //     foreach ($ventas as &$v) {
    //         $v['productos'] = !empty($v['productos']) ? json_decode($v['productos'], true) : [];
    //         $v['pagos']     = !empty($v['pagos'])     ? json_decode($v['pagos'],     true) : [];
    //     }
    //     return $ventas;
    // }

    public function obtenerVentasCompletas($filtros = [])
    {
        $page    = max(1, (int) ($filtros['page']     ?? 1));
        $perPage = max(1, (int) ($filtros['per_page'] ?? 10));
        $offset  = ($page - 1) * $perPage;

        $where  = ['1=1'];
        $params = [];

        if (!empty($filtros['estado'])) {
            $where[]  = "venta_estado = ?";
            $params[] = $filtros['estado'];
        }
        if (!empty($filtros['tipo_pago'])) {
            $where[]  = "tipo_pago = ?";
            $params[] = $filtros['tipo_pago'];
        }
        if (!empty($filtros['cliente_id'])) {
            $where[]  = "cliente_id = ?";
            $params[] = $filtros['cliente_id'];
        }
        if (!empty($filtros['fecha_desde'])) {
            $where[]  = "fecha_venta >= ?";
            $params[] = $filtros['fecha_desde'];
        }
        if (!empty($filtros['fecha_hasta'])) {
            $where[]  = "fecha_venta <= ?";
            $params[] = $filtros['fecha_hasta'];
        }
        if (!empty($filtros['buscar'])) {
            $where[]  = "(cliente_nombre ILIKE ? OR numero_factura ILIKE ?)";
            $b        = "%{$filtros['buscar']}%";
            $params[] = $b;
            $params[] = $b;
        }

        $whereStr = implode(' AND ', $where);

        // ── Total de registros ────────────────────────────
        $countSql  = "SELECT COUNT(*) AS total FROM ventas_completas WHERE $whereStr";
        $countStmt = $this->conn->prepare($countSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // ── Estadísticas globales (sin paginación) ────────
        $statsSql  = "SELECT 
                        COALESCE(SUM(venta_total), 0)    AS total_vendido,
                        COALESCE(SUM(saldo_pendiente), 0) AS total_por_cobrar
                      FROM ventas_completas WHERE $whereStr";
        $statsStmt = $this->conn->prepare($statsSql);
        $statsStmt->execute($params);
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        // ── Datos paginados ───────────────────────────────
        $sql  = "SELECT * FROM ventas_completas WHERE $whereStr ORDER BY fecha_venta DESC";
        $stmt = $this->conn->prepare($sql . " LIMIT ? OFFSET ?");

        // Bindear params de filtros como string
        foreach ($params as $i => $val) {
            $stmt->bindValue($i + 1, $val, PDO::PARAM_STR);
        }
        $stmt->bindValue(count($params) + 1, $perPage, PDO::PARAM_INT);
        $stmt->bindValue(count($params) + 2, $offset,  PDO::PARAM_INT);
        $stmt->execute();

        $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($ventas as &$v) {
            $v['productos'] = !empty($v['productos']) ? json_decode($v['productos'], true) : [];
            $v['pagos']     = !empty($v['pagos'])     ? json_decode($v['pagos'],     true) : [];
        }

        return [
            'data'             => $ventas,
            'total'            => $total,
            'page'             => $page,
            'per_page'         => $perPage,
            'last_page'        => (int) ceil($total / $perPage),
            'total_vendido'    => (float) $stats['total_vendido'],
            'total_por_cobrar' => (float) $stats['total_por_cobrar'],
        ];
    }

    public function obtenerVentaCompletaPorId($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM ventas_completas WHERE venta_id = ?");
        $stmt->execute([$id]);
        $venta = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($venta) {
            $venta['productos'] = !empty($venta['productos']) ? json_decode($venta['productos'], true) : [];
            $venta['pagos']     = !empty($venta['pagos'])     ? json_decode($venta['pagos'],     true) : [];
        }
        return $venta;
    }

    public function cancelar($id)
    {
        $this->conn->beginTransaction();
        try {
            $stmt = $this->conn->prepare("SELECT * FROM ventas_detalle WHERE venta_id = ?");
            $stmt->execute([$id]);
            $detalles = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($detalles as $detalle) {
                $stmt = $this->conn->prepare(
                    "UPDATE producto_variantes SET stock = stock + ?, estado = 'disponible' WHERE id = ?"
                );
                $stmt->execute([$detalle['cantidad'], $detalle['variante_id']]);
            }

            $stmt = $this->conn->prepare("UPDATE ventas SET estado = 'cancelada' WHERE id = ?");
            $stmt->execute([$id]);

            $this->conn->commit();
            return ['success' => true, 'message' => 'Venta cancelada y stock devuelto'];
        } catch (\Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function getHistorialCompleto(): array
    {
        try {
            $stmt = $this->conn->query("
                SELECT venta_id, numero_factura, fecha_venta, cliente_id,
                       cliente_nombre, monto_venta, tipo_pago, estado_venta,
                       total_pagado, saldo_pendiente, productos, pagos
                FROM historial_cliente
                ORDER BY fecha_venta DESC
            ");
            $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($resultados as &$r) {
                $r['productos'] = !empty($r['productos']) ? json_decode($r['productos'], true) : [];
                $r['pagos']     = !empty($r['pagos'])     ? json_decode($r['pagos'],     true) : [];
            }
            return $resultados;
        } catch (\PDOException $e) {
            throw new \Exception("Error al obtener historial: " . $e->getMessage());
        }
    }
}
