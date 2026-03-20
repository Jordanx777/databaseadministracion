<?php
// Backend/src/Controllers/DashboardController.php

namespace App\Controllers;

use App\Models\DashboardModel;
use App\Helpers\ResponseHelper;

class DashboardController
{
    private $dashboardModel;

    public function __construct()
    {
        $this->dashboardModel = new DashboardModel();
    }

    /**
     * Obtener todas las estadísticas del dashboard
     */
    public function getDashboardCompleto()
    {
        try {
            $data = [
                'resumen_general' => $this->dashboardModel->getResumenGeneral(),
                'estadisticas_ventas' => $this->dashboardModel->getEstadisticasVentas(),
                'estadisticas_cuentas' => $this->dashboardModel->getEstadisticasCuentas(),
                'productos_mas_vendidos' => $this->dashboardModel->getProductosMasVendidos(10),
                'productos_stock_bajo' => $this->dashboardModel->getProductosStockBajo(5),
                'ventas_por_categoria' => $this->dashboardModel->getVentasPorCategoria(),
                'ventas_por_genero' => $this->dashboardModel->getVentasPorGenero(),
                'ventas_ultimos_7_dias' => $this->dashboardModel->getVentasUltimos7Dias(),
                'ventas_mensuales' => $this->dashboardModel->getVentasMensuales(),
                'stock_por_categoria' => $this->dashboardModel->getStockPorCategoria(),
                'clientes_mayor_deuda' => $this->dashboardModel->getClientesMayorDeuda(10),
            ];

            ResponseHelper::success($data, 'Estadísticas obtenidas exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    /**
     * Obtener solo resumen general
     */
    public function getResumenGeneral()
    {
        try {
            $data = $this->dashboardModel->getResumenGeneral();
            ResponseHelper::success($data, 'Resumen obtenido exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    /**
     * Obtener estadísticas de ventas
     */
    public function getEstadisticasVentas()
    {
        try {
            $data = $this->dashboardModel->getEstadisticasVentas();
            ResponseHelper::success($data, 'Estadísticas de ventas obtenidas');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    /**
     * Obtener productos más vendidos
     */
    public function getProductosMasVendidos()
    {
        try {
            $limite = $_GET['limite'] ?? 10;
            $data = $this->dashboardModel->getProductosMasVendidos((int)$limite);
            ResponseHelper::success($data, 'Productos más vendidos obtenidos');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }
}