<?php
// Backend/src/Models/Venta.php

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

    /**
     * Crear una nueva venta con detalles y pagos
     */
    public function crear($data)
    {
        $this->conn->beginTransaction();

        try {
            // 1. Generar número de factura único
            $numero_factura = $this->generarNumeroFactura();

            // 2. Obtener usuario_id del token (debes implementar esto según tu auth)
            $usuario_id = $data['usuario_id'] ?? 1; // Por ahora 1 por defecto
            error_log("Usuario ID para la venta: " . $usuario_id);

            // 3. Validar que si es crédito, debe tener cliente_id
            if ($data['tipo_pago'] === 'credito' && empty($data['cliente_id'])) {
                throw new \Exception('Las ventas a crédito requieren un cliente registrado');
            }

            // 4. Determinar estado inicial
            $estado = 'pendiente';
            if ($data['tipo_pago'] === 'contado') {
                $estado = 'pagada';
            } elseif ($data['tipo_pago'] === 'mixto' && isset($data['pagos']) && count($data['pagos']) > 0) {
                // Calcular si el pago inicial cubre el total
                $total_pagos = array_sum(array_column($data['pagos'], 'monto'));
                if ($total_pagos >= $data['total']) {
                    $estado = 'pagada';
                }
            }

            // 5. Insertar VENTA
            $sql = "INSERT INTO ventas (
                        numero_factura,
                        cliente_id,
                        cliente_nombre,
                        cliente_telefono,
                        cliente_referencia,
                        usuario_id,
                        subtotal,
                        descuento,
                        total,
                        tipo_pago,
                        estado,
                        notas
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    RETURNING id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $numero_factura,
                $data['cliente_id'],
                $data['cliente_nombre'],
                $data['cliente_telefono'],
                $data['cliente_referencia'],
                $usuario_id,
                $data['subtotal'],
                $data['descuento'],
                $data['total'],
                $data['tipo_pago'],
                $estado,
                $data['notas']
            ]);

            $venta_id = $stmt->fetchColumn();

            // 6. Insertar DETALLES
            if (empty($data['detalles']) || !is_array($data['detalles'])) {
                throw new \Exception('La venta debe tener al menos un producto');
            }

            foreach ($data['detalles'] as $detalle) {
                $this->insertarDetalle($venta_id, $detalle);
                $this->actualizarStockVariante($detalle['variante_id'], $detalle['cantidad']);
            }

            // 7. Insertar PAGOS (si los hay)
            if (!empty($data['pagos']) && is_array($data['pagos'])) {
                foreach ($data['pagos'] as $pago) {
                    if ($pago['monto'] > 0) {
                        $this->insertarPago($venta_id, $pago, $usuario_id);
                    }
                }
            }

            $this->conn->commit();

            return [
                'success' => true,
                'data' => [
                    'venta_id' => $venta_id,
                    'numero_factura' => $numero_factura,
                    'estado' => $estado,
                    'total' => $data['total']
                ],
                'message' => 'Venta registrada exitosamente'
            ];
        } catch (\Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    /**
     * Insertar detalle de venta
     */
    private function insertarDetalle($venta_id, $detalle)
    {
        // Validar stock antes de insertar
        $sql = "SELECT stock FROM producto_variantes WHERE id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$detalle['variante_id']]);
        $variante = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$variante) {
            throw new \Exception("Variante {$detalle['variante_id']} no encontrada");
        }

        if ($variante['stock'] < $detalle['cantidad']) {
            throw new \Exception(
                "Stock insuficiente para la variante {$detalle['variante_id']}. " .
                    "Disponible: {$variante['stock']}, Solicitado: {$detalle['cantidad']}"
            );
        }

        // Insertar detalle
        $sql = "INSERT INTO ventas_detalle (
                    venta_id,
                    producto_id,
                    variante_id,
                    cantidad,
                    precio_unitario,
                    subtotal,
                    talla_vendida,
                    color_vendido,
                    genero_vendido
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

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
            $detalle['genero_vendido']
        ]);
    }

    /**
     * Actualizar stock de variante
     */
    private function actualizarStockVariante($variante_id, $cantidad)
    {
        $sql = "UPDATE producto_variantes 
                SET stock = stock - ? 
                WHERE id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$cantidad, $variante_id]);

        // Marcar como agotado si stock = 0
        $sql = "UPDATE producto_variantes 
                SET estado = 'agotado' 
                WHERE id = ? AND stock <= 0";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$variante_id]);
    }

    /**
     * Insertar pago
     */
    private function insertarPago($venta_id, $pago, $usuario_id)
    {
        $sql = "INSERT INTO pagos (
                    venta_id,
                    monto,
                    metodo_pago,
                    referencia,
                    notas,
                    registrado_por
                ) VALUES (?, ?, ?, ?, ?, ?)";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            $venta_id,
            $pago['monto'],
            $pago['metodo_pago'],
            $pago['referencia'] ?? null,
            $pago['notas'] ?? null,
            $usuario_id
        ]);
    }

    /**
     * Generar número de factura único
     */
    private function generarNumeroFactura()
    {
        $fecha = date('Ymd');

        // Obtener el último número del día
        $sql = "SELECT numero_factura 
                FROM ventas 
                WHERE numero_factura LIKE ? 
                ORDER BY id DESC 
                LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute(["FAC-{$fecha}-%"]);
        $ultima = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($ultima) {
            // Extraer el número secuencial
            $partes = explode('-', $ultima['numero_factura']);
            $secuencial = intval(end($partes)) + 1;
        } else {
            $secuencial = 1;
        }

        return sprintf('FAC-%s-%04d', $fecha, $secuencial);
    }

    /**
     * Obtener todas las ventas
     */
    public function obtenerVentasCompletas($filtros = [])
    {
        $sql = "SELECT * FROM ventas_completas WHERE 1=1";
        $params = [];

        // Filtros
        if (!empty($filtros['estado'])) {
            $sql .= " AND venta_estado = ?";
            $params[] = $filtros['estado'];
        }

        if (!empty($filtros['tipo_pago'])) {
            $sql .= " AND tipo_pago = ?";
            $params[] = $filtros['tipo_pago'];
        }

        if (!empty($filtros['cliente_id'])) {
            $sql .= " AND cliente_id = ?";
            $params[] = $filtros['cliente_id'];
        }

        if (!empty($filtros['fecha_desde'])) {
            $sql .= " AND fecha_venta >= ?";
            $params[] = $filtros['fecha_desde'];
        }

        if (!empty($filtros['fecha_hasta'])) {
            $sql .= " AND fecha_venta <= ?";
            $params[] = $filtros['fecha_hasta'];
        }

        // Buscar por nombre de cliente
        if (!empty($filtros['buscar'])) {
            $sql .= " AND (cliente_nombre ILIKE ? OR numero_factura ILIKE ?)";
            $busqueda = "%{$filtros['buscar']}%";
            $params[] = $busqueda;
            $params[] = $busqueda;
        }

        $sql .= " ORDER BY fecha_venta DESC";

        // Límite
        if (!empty($filtros['limit'])) {
            $sql .= " LIMIT ?";
            $params[] = intval($filtros['limit']);
        }

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);

        $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decodificar JSON de productos y pagos
        foreach ($ventas as &$venta) {
            $venta['productos'] = !empty($venta['productos'])
                ? json_decode($venta['productos'], true)
                : [];

            $venta['pagos'] = !empty($venta['pagos'])
                ? json_decode($venta['pagos'], true)
                : [];
        }

        return $ventas;
    }


    /**
     * Obtener venta completa por ID
     */
    public function obtenerVentaCompletaPorId($id)
    {
        $sql = "SELECT * FROM ventas_completas WHERE venta_id = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$id]);

        $venta = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($venta) {
            $venta['productos'] = !empty($venta['productos'])
                ? json_decode($venta['productos'], true)
                : [];

            $venta['pagos'] = !empty($venta['pagos'])
                ? json_decode($venta['pagos'], true)
                : [];
        }

        return $venta;
    }

    /**
     * Cancelar una venta (devolver stock)
     */
    public function cancelar($id)
    {
        $this->conn->beginTransaction();

        try {
            // Obtener detalles de la venta
            $sql = "SELECT * FROM ventas_detalle WHERE venta_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            $detalles = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Devolver stock
            foreach ($detalles as $detalle) {
                $sql = "UPDATE producto_variantes 
                        SET stock = stock + ?, 
                            estado = 'disponible' 
                        WHERE id = ?";

                $stmt = $this->conn->prepare($sql);
                $stmt->execute([
                    $detalle['cantidad'],
                    $detalle['variante_id']
                ]);
            }

            // Marcar venta como cancelada
            $sql = "UPDATE ventas SET estado = 'cancelada' WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);

            $this->conn->commit();

            return [
                'success' => true,
                'message' => 'Venta cancelada y stock devuelto'
            ];
        } catch (\Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }
}
