<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class DashboardModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::connect();
    }

    /**
     * Obtener resumen general del inventario
     */
    public function getResumenGeneral(): array
    {
        $stmt = $this->db->query("
            SELECT 
                -- Total de productos
                (SELECT COUNT(*) FROM productos WHERE estado = 'disponible') as total_productos,
                
                -- Total de variantes
                (SELECT COUNT(*) FROM producto_variantes WHERE estado = 'disponible') as total_variantes,
                
                -- Stock total
                (SELECT COALESCE(SUM(stock), 0) FROM producto_variantes) as stock_total,
                
                -- Valor total del inventario (precio_venta * stock)
                (SELECT COALESCE(SUM(p.precio_venta * pv.stock), 0)
                 FROM productos p
                 JOIN producto_variantes pv ON p.id = pv.producto_id
                 WHERE p.estado = 'disponible') as valor_inventario,
                
                -- Productos con stock bajo (< 5)
                (SELECT COUNT(DISTINCT producto_id) 
                 FROM producto_variantes 
                 WHERE stock < 5 AND stock > 0) as productos_stock_bajo,
                
                -- Productos sin stock
                (SELECT COUNT(DISTINCT producto_id) 
                 FROM producto_variantes 
                 WHERE stock = 0) as productos_sin_stock
        ");
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener estadísticas de ventas
     */
    public function getEstadisticasVentas(): array
    {
        $stmt = $this->db->query("
            SELECT 
                -- Ventas del día
                (SELECT COALESCE(SUM(total), 0) 
                 FROM ventas 
                 WHERE DATE(fecha_venta) = CURRENT_DATE 
                   AND estado != 'cancelada') as ventas_hoy,
                
                -- Ventas del mes
                (SELECT COALESCE(SUM(total), 0) 
                 FROM ventas 
                 WHERE DATE_TRUNC('month', fecha_venta) = DATE_TRUNC('month', CURRENT_DATE)
                   AND estado != 'cancelada') as ventas_mes,
                
                -- Total de ventas
                (SELECT COALESCE(SUM(total), 0) 
                 FROM ventas 
                 WHERE estado != 'cancelada') as ventas_totales,
                
                -- Número de ventas del día
                (SELECT COUNT(*) 
                 FROM ventas 
                 WHERE DATE(fecha_venta) = CURRENT_DATE 
                   AND estado != 'cancelada') as num_ventas_hoy,
                
                -- Número de ventas del mes
                (SELECT COUNT(*) 
                 FROM ventas 
                 WHERE DATE_TRUNC('month', fecha_venta) = DATE_TRUNC('month', CURRENT_DATE)
                   AND estado != 'cancelada') as num_ventas_mes,
                
                -- Promedio de venta
                (SELECT COALESCE(AVG(total), 0) 
                 FROM ventas 
                 WHERE estado != 'cancelada') as promedio_venta
        ");
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener estadísticas de cuentas por cobrar
     */
    public function getEstadisticasCuentas(): array
    {
        $stmt = $this->db->query("
            SELECT 
                COUNT(DISTINCT cliente_id) as total_clientes_deuda,
                COALESCE(SUM(saldo_pendiente), 0) as total_por_cobrar,
                COALESCE(AVG(saldo_pendiente), 0) as promedio_deuda,
                COUNT(*) as total_facturas_pendientes
            FROM cuentas_por_cobrar
        ");
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Top 10 productos más vendidos
     */
    public function getProductosMasVendidos(int $limite = 10): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                p.id,
                p.nombre as producto_nombre,
                m.nombre as marca_nombre,
                c.nombre as categoria_nombre,
                SUM(vd.cantidad) as total_vendido,
                COALESCE(SUM(pv.stock), 0) as stock_actual,
                p.precio_venta
            FROM ventas_detalle vd
            JOIN productos p ON vd.producto_id = p.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN producto_variantes pv ON p.id = pv.producto_id
            JOIN ventas v ON vd.venta_id = v.id
            WHERE v.estado != 'cancelada'
            GROUP BY p.id, p.nombre, m.nombre, c.nombre, p.precio_venta
            ORDER BY total_vendido DESC
            LIMIT ?
        ");
        $stmt->execute([$limite]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Productos con stock bajo
     */
    public function getProductosStockBajo(int $limite = 5): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                p.id,
                p.nombre as producto_nombre,
                m.nombre as marca_nombre,
                c.nombre as categoria_nombre,
                COALESCE(SUM(pv.stock), 0) as stock_total,
                p.precio_venta
            FROM productos p
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN producto_variantes pv ON p.id = pv.producto_id
            WHERE p.estado = 'disponible'
            GROUP BY p.id, p.nombre, m.nombre, c.nombre, p.precio_venta
            HAVING COALESCE(SUM(pv.stock), 0) <= ?
            ORDER BY stock_total ASC
            LIMIT 10
        ");
        $stmt->execute([$limite]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ventas por categoría
     */
    public function getVentasPorCategoria(): array
    {
        $stmt = $this->db->query("
            SELECT 
                c.nombre as categoria,
                COUNT(DISTINCT vd.venta_id) as num_ventas,
                SUM(vd.cantidad) as cantidad_vendida,
                SUM(vd.subtotal) as total_vendido
            FROM ventas_detalle vd
            JOIN productos p ON vd.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            JOIN ventas v ON vd.venta_id = v.id
            WHERE v.estado != 'cancelada'
            GROUP BY c.id, c.nombre
            ORDER BY total_vendido DESC
        ");
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ventas por género
     */
    public function getVentasPorGenero(): array
    {
        $stmt = $this->db->query("
            SELECT 
                COALESCE(p.genero, 'Sin especificar') as genero,
                COUNT(DISTINCT vd.venta_id) as num_ventas,
                SUM(vd.cantidad) as cantidad_vendida,
                SUM(vd.subtotal) as total_vendido
            FROM ventas_detalle vd
            JOIN productos p ON vd.producto_id = p.id
            JOIN ventas v ON vd.venta_id = v.id
            WHERE v.estado != 'cancelada'
            GROUP BY p.genero
            ORDER BY total_vendido DESC
        ");
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ventas de los últimos 7 días
     */
    public function getVentasUltimos7Dias(): array
    {
        $stmt = $this->db->query("
            SELECT 
                DATE(fecha_venta) as fecha,
                COUNT(*) as num_ventas,
                COALESCE(SUM(total), 0) as total_ventas
            FROM ventas
            WHERE fecha_venta >= CURRENT_DATE - INTERVAL '7 days'
              AND estado != 'cancelada'
            GROUP BY DATE(fecha_venta)
            ORDER BY fecha ASC
        ");
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ventas mensuales del año actual
     */
    public function getVentasMensuales(): array
    {
        $stmt = $this->db->query("
            SELECT 
                TO_CHAR(fecha_venta, 'Month') as mes,
                EXTRACT(MONTH FROM fecha_venta) as mes_numero,
                COUNT(*) as num_ventas,
                COALESCE(SUM(total), 0) as total_ventas
            FROM ventas
            WHERE EXTRACT(YEAR FROM fecha_venta) = EXTRACT(YEAR FROM CURRENT_DATE)
              AND estado != 'cancelada'
            GROUP BY TO_CHAR(fecha_venta, 'Month'), EXTRACT(MONTH FROM fecha_venta)
            ORDER BY mes_numero ASC
        ");
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Distribución de stock por categoría
     */
    public function getStockPorCategoria(): array
    {
        $stmt = $this->db->query("
            SELECT 
                c.nombre as categoria,
                COUNT(DISTINCT p.id) as num_productos,
                COALESCE(SUM(pv.stock), 0) as stock_total,
                COALESCE(SUM(p.precio_venta * pv.stock), 0) as valor_inventario
            FROM categorias c
            LEFT JOIN productos p ON c.id = p.categoria_id
            LEFT JOIN producto_variantes pv ON p.id = pv.producto_id
            WHERE c.activo = true AND p.estado = 'disponible'
            GROUP BY c.id, c.nombre
            ORDER BY stock_total DESC
        ");
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Clientes con mayor deuda
     */
    public function getClientesMayorDeuda(int $limite = 10): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                cliente_id,
                nombre,
                telefono,
                saldo_pendiente,
                num_facturas,
                dias_mora
            FROM cuentas_por_cobrar
            ORDER BY saldo_pendiente DESC
            LIMIT ?
        ");
        $stmt->execute([$limite]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}