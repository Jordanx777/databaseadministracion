<?php
namespace App\Controllers;
use App\Models\CuentasModel;
use App\Models\VentasModel;
use App\Models\ClientesModel;

class CuentasController {
    private $cuentasModel;
    private $ventasModel;
    private $clientesModel;

    public function __construct() {
        $this->cuentasModel = new CuentasModel();
        $this->ventasModel = new VentasModel();
        $this->clientesModel = new ClientesModel();
    }

    // 1. Listar todas las cuentas por cobrar
    public function listarCuentasPorCobrar() {
        $cuentas = $this->cuentasModel->getCuentasPorCobrar();
        echo json_encode($cuentas);
    }

    // 2. Listar solo las cuentas activas
    public function listarCuentasActivas() {
        $cuentas = $this->cuentasModel->getCuentasActivas();
        echo json_encode($cuentas);
    }

    // 3. Obtener deuda de un cliente registrado
    public function obtenerDeudaClienteRegistrado($clienteId) {
        $deuda = $this->cuentasModel->getDeudaClienteRegistrado($clienteId);
        echo json_encode($deuda);
    }

    // 4. Buscar deuda de cliente ocasional por nombre
    public function buscarDeudaClienteOcasional() {
        $nombre = $_GET['nombre'] ?? '';
        $deudas = $this->cuentasModel->buscarDeudaClienteOcasional($nombre);
        echo json_encode($deudas);
    }

    // 5. Obtener historial completo de un cliente
    public function obtenerHistorialCliente($clienteId) {
        $historial = $this->cuentasModel->getHistorialCliente($clienteId);
        echo json_encode($historial);
    }

    // 6. Obtener resumen de deuda de un cliente (total adeudado, total pagado, etc.)
    public function obtenerResumenDeuda($clienteId) {
        $resumen = $this->cuentasModel->getResumenDeuda($clienteId);
        echo json_encode($resumen);
    }   
}

?>