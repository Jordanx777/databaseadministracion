<?php
// Backend/src/Models/PagosModel.php

namespace App\Models;

use App\Config\Database;
use PDO;
use PDOException;

class PagosModel
{
    private $conn;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    /**
     * Registrar un nuevo pago
     */
    public function registrar($data)
    {
        $this->conn->beginTransaction();

        try {
            // 1. Validar que la venta existe y tiene saldo pendiente
            $sql = "SELECT v.id, v.total, v.estado,
                           COALESCE(SUM(p.monto), 0) as total_pagado
                    FROM ventas v
                    LEFT JOIN pagos p ON v.id = p.venta_id
                    WHERE v.id = ?
                    GROUP BY v.id, v.total, v.estado";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$data['venta_id']]);
            $venta = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$venta) {
                throw new \Exception('Venta no encontrada');
            }

            $saldo_pendiente = $venta['total'] - $venta['total_pagado'];

            if ($saldo_pendiente <= 0) {
                throw new \Exception('Esta venta ya está completamente pagada');
            }

            if ($data['monto'] > $saldo_pendiente) {
                throw new \Exception(
                    "El monto del pago (\$" . number_format($data['monto'], 2) . ") " .
                    "excede el saldo pendiente (\$" . number_format($saldo_pendiente, 2) . ")"
                );
            }

            // 2. Registrar el pago
            $sql = "INSERT INTO pagos (
                        venta_id,
                        monto,
                        metodo_pago,
                        referencia,
                        notas,
                        registrado_por
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    RETURNING id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $data['venta_id'],
                $data['monto'],
                $data['metodo_pago'],
                $data['referencia'] ?? null,
                $data['notas'] ?? null,
                $data['registrado_por'] ?? 1
            ]);

            $pago_id = $stmt->fetchColumn();

            // 3. Actualizar estado de la venta si quedó pagada
            $nuevo_total_pagado = $venta['total_pagado'] + $data['monto'];
            $nuevo_saldo = $venta['total'] - $nuevo_total_pagado;

            if ($nuevo_saldo <= 0.01) { // Considerar pagada si el saldo es < 1 centavo
                $sql = "UPDATE ventas SET estado = 'pagada' WHERE id = ?";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([$data['venta_id']]);
            }

            $this->conn->commit();

            return [
                'success' => true,
                'message' => 'Pago registrado exitosamente',
                'data' => [
                    'pago_id' => $pago_id,
                    'venta_actualizada' => [
                        'venta_id' => $data['venta_id'],
                        'total' => $venta['total'],
                        'total_pagado' => $nuevo_total_pagado,
                        'saldo_pendiente' => $nuevo_saldo,
                        'nuevo_estado' => $nuevo_saldo <= 0.01 ? 'pagada' : 'pendiente'
                    ]
                ]
            ];

        } catch (\Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    /**
     * Obtener pagos de una venta
     */
    public function obtenerPorVenta($ventaId)
    {
        $sql = "SELECT 
                    p.*,
                    CONCAT(u.nombre, ' ', u.apellido) as registrado_por_nombre
                FROM pagos p
                LEFT JOIN usuario u ON p.registrado_por = u.id_usuario
                WHERE p.venta_id = ?
                ORDER BY p.fecha_pago DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$ventaId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener un pago por ID
     */
    public function obtenerPorId($pagoId)
    {
       $sql = "SELECT 
                    p.*,
                    v.numero_factura,
                    COALESCE(c.nombre, v.cliente_nombre) as cliente_nombre,
                    CONCAT(u.nombre, ' ', u.apellido) as registrado_por_nombre
                FROM pagos p
                JOIN ventas v ON p.venta_id = v.id
                LEFT JOIN clientes c ON v.cliente_id = c.id
                LEFT JOIN usuario u ON p.registrado_por = u.id_usuario
                WHERE p.id = ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$pagoId]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Eliminar un pago (devolver el monto al saldo)
     */
    public function eliminar($pagoId)
    {
        $this->conn->beginTransaction();

        try {
            // Obtener datos del pago
            $sql = "SELECT venta_id, monto FROM pagos WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$pagoId]);
            $pago = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$pago) {
                throw new \Exception('Pago no encontrado');
            }

            // Eliminar el pago
            $sql = "DELETE FROM pagos WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$pagoId]);

            // Actualizar estado de la venta a 'pendiente'
            $sql = "UPDATE ventas SET estado = 'pendiente' WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$pago['venta_id']]);

            $this->conn->commit();

            return [
                'success' => true,
                'message' => 'Pago eliminado exitosamente'
            ];

        } catch (\Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }
}