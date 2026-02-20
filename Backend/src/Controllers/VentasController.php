<?php

namespace App\Controllers;

use App\Models\VentasModel;

class VentasController {
    private $ventaModel;
    
    public function __construct() {
        $this->ventaModel = new VentasModel();
    }
    
    /**
     * Crear una nueva venta
     * POST /api/ventas
     */
    public function crear() {
        try {
            // Obtener datos del body
            $data = json_decode(file_get_contents('php://input'), true);
            error_log("Datos recibidos para crear venta: " . json_encode($data));
            
            // Validaciones básicas
            if (empty($data['total']) || $data['total'] <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'El total de la venta debe ser mayor a cero'
                ]);
                return;
            }
            
            if (empty($data['detalles']) || !is_array($data['detalles'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'La venta debe contener al menos un producto'
                ]);
                return;
            }
            
            // Validar cliente
            if (empty($data['cliente_id']) && empty($data['cliente_nombre'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Debe especificar un cliente registrado o un nombre de cliente'
                ]);
                return;
            }
            
            // Validar tipo de pago
            $tiposPagoValidos = ['contado', 'credito', 'mixto'];
            if (empty($data['tipo_pago']) || !in_array($data['tipo_pago'], $tiposPagoValidos)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Tipo de pago inválido'
                ]);
                return;
            }
            
            // Crear venta
            $resultado = $this->ventaModel->crear($data);
            
            http_response_code(201);
            echo json_encode($resultado);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al crear la venta: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Obtener todas las ventas
     * GET /api/ventas
     */
    public function obtenerTodas() {
        try {
            $filtros = $_GET ?? [];
            $ventas = $this->ventaModel->obtenerTodas($filtros);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $ventas,
                'total' => count($ventas)
            ]);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener ventas: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Obtener una venta por ID
     * GET /api/ventas/:id
     */
    public function obtenerPorId($id) {
        try {
            $venta = $this->ventaModel->obtenerPorId($id);
            
            if (!$venta) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Venta no encontrada'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $venta
            ]);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener la venta: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Cancelar una venta
     * PUT /api/ventas/:id/cancelar
     */
    public function cancelar($id) {
        try {
            $resultado = $this->ventaModel->cancelar($id);
            
            http_response_code(200);
            echo json_encode($resultado);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al cancelar la venta: ' . $e->getMessage()
            ]);
        }
    }
}