<?php

namespace App\Controllers;

use App\Models\CuentasModel;
use App\Models\VentasModel;
use App\Models\ClientesModel;
use App\Helpers\ResponseHelper;
use Exception;

class CuentasController
{
    private $cuentasModel;
    private $ventasModel;
    private $clientesModel;

    public function __construct()
    {
        $this->cuentasModel = new CuentasModel();
        $this->ventasModel = new VentasModel();
        $this->clientesModel = new ClientesModel();
    }

    // 1. Listar todas las cuentas por cobrar
    public function listarCuentasPorCobrar()
    {
        $cuentas = $this->cuentasModel->getCuentasPorCobrar();
        echo json_encode($cuentas);
    }

    // 2. Listar solo las cuentas activas
    public function listarCuentasActivas()
    {
        $cuentas = $this->cuentasModel->getCuentasActivas();
        echo json_encode($cuentas);
    }

    // 3. Obtener deuda de un cliente registrado
    public function obtenerDeudaClienteRegistrado(array $params)
    {
        $clienteId = $params['clienteId'] ?? null;
        $deuda = $this->cuentasModel->getDeudaClienteRegistrado($clienteId);
        echo json_encode($deuda);
    }

    // 4. Buscar deuda de cliente ocasional por nombre
    public function buscarDeudaClienteOcasional()
    {
        $nombre = $_GET['nombre'] ?? '';
        $deudas = $this->cuentasModel->buscarDeudaClienteOcasional($nombre);
        echo json_encode($deudas);
    }

    // 5. Obtener historial completo activo de un cliente
    public function obtenerHistorialClienteActivos(array $params)
    {
        $clienteId = $params['clienteId'] ?? null;

        if (!$clienteId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID de cliente no proporcionado'
            ]);
            return;
        }

        try {
            $historial = $this->cuentasModel->getHistorialClienteActivas($clienteId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $historial,
                'total' => count($historial)
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener historial: ' . $e->getMessage()
            ]);
        }
    }

    // 6. Obtener historial completo de un cliente
    public function obtenerHistorialCliente(array $params)
    {
        $clienteId = $params['clienteId'] ?? null;

        if (!$clienteId) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID de cliente no proporcionado'
            ]);
            return;
        }

        try {
            $historial = $this->cuentasModel->getHistorialCliente($clienteId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $historial,
                'total' => count($historial)
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener historial: ' . $e->getMessage()
            ]);
        }
    }

    // 7. Obtener resumen de deuda de un cliente (total adeudado, total pagado, etc.)
    public function obtenerResumenDeuda($clienteId)
    {
        $resumen = $this->cuentasModel->getResumenDeuda($clienteId);
        echo json_encode($resumen);
    }
    
}
