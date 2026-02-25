<?php

namespace App\Controllers;

use App\Models\PagosModel;

class PagosController{
    private $pagosModel;

    public function __construct()
    {
        $this->pagosModel = new PagosModel();
    }

    /**
     * Registrar un nuevo pago
     * POST /api/pagos
     */
    public function registrar()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);;

            // Validaciones básicas
            if (empty($data['venta_id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El ID de la venta es obligatorio'
                ]);
                return;
            }

            if (empty($data['monto']) || $data['monto'] <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El monto debe ser mayor a cero'
                ]);
                return;
            }

            if (empty($data['metodo_pago'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El método de pago es obligatorio'
                ]);
                return;
            }

            // Registrar el pago
            $resultado = $this->pagosModel->registrar($data);

            http_response_code(201);
            echo json_encode($resultado);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al registrar el pago: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Listar pagos de una venta
     * GET /api/pagos/venta/:id
     */
    public function listarPorVenta($params)
    {
        try {
            $ventaId = $params['id'] ?? null;

            if (!$ventaId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID de venta no proporcionado'
                ]);
                return;
            }

            $pagos = $this->pagosModel->obtenerPorVenta($ventaId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $pagos,
                'total' => count($pagos)
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener pagos: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Obtener un pago por ID
     * GET /api/pagos/:id
     */
    public function obtenerPorId($params)
    {
        try {
            $pagoId = $params['id'] ?? null;

            if (!$pagoId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID de pago no proporcionado'
                ]);
                return;
            }

            $pago = $this->pagosModel->obtenerPorId($pagoId);

            if (!$pago) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Pago no encontrado'
                ]);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $pago
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener el pago: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Eliminar un pago
     * DELETE /api/pagos/:id
     */
    public function eliminar($params)
    {
        try {
            $pagoId = $params['id'] ?? null;

            if (!$pagoId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID de pago no proporcionado'
                ]);
                return;
            }

            $resultado = $this->pagosModel->eliminar($pagoId);

            http_response_code(200);
            echo json_encode($resultado);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al eliminar el pago: ' . $e->getMessage()
            ]);
        }
    }
}
?>