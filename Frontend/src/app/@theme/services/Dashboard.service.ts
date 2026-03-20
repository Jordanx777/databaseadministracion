
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ResumenGeneral {
  total_productos: number;
  total_variantes: number;
  stock_total: number;
  valor_inventario: number;
  productos_stock_bajo: number;
  productos_sin_stock: number;
}

export interface EstadisticasVentas {
  ventas_hoy: number;
  ventas_mes: number;
  ventas_totales: number;
  num_ventas_hoy: number;
  num_ventas_mes: number;
  promedio_venta: number;
}

export interface EstadisticasCuentas {
  total_clientes_deuda: number;
  total_por_cobrar: number;
  promedio_deuda: number;
  total_facturas_pendientes: number;
}

export interface ProductoMasVendido {
  id: number;
  producto_nombre: string;
  marca_nombre: string;
  categoria_nombre: string;
  total_vendido: number;
  stock_actual: number;
  precio_venta: number;
}

export interface ProductoStockBajo {
  id: number;
  producto_nombre: string;
  marca_nombre: string;
  categoria_nombre: string;
  stock_total: number;
  precio_venta: number;
}

export interface VentasPorCategoria {
  categoria: string;
  num_ventas: number;
  cantidad_vendida: number;
  total_vendido: number;
}

export interface VentasPorGenero {
  genero: string;
  num_ventas: number;
  cantidad_vendida: number;
  total_vendido: number;
}

export interface VentasDiarias {
  fecha: string;
  num_ventas: number;
  total_ventas: number;
}

export interface VentasMensuales {
  mes: string;
  mes_numero: number;
  num_ventas: number;
  total_ventas: number;
}

export interface StockPorCategoria {
  categoria: string;
  num_productos: number;
  stock_total: number;
  valor_inventario: number;
}

export interface ClienteMayorDeuda {
  cliente_id: number;
  nombre: string;
  telefono: string;
  saldo_pendiente: number;
  num_facturas: number;
  dias_mora: number;
}

export interface DashboardCompleto {
  resumen_general: ResumenGeneral;
  estadisticas_ventas: EstadisticasVentas;
  estadisticas_cuentas: EstadisticasCuentas;
  productos_mas_vendidos: ProductoMasVendido[];
  productos_stock_bajo: ProductoStockBajo[];
  ventas_por_categoria: VentasPorCategoria[];
  ventas_por_genero: VentasPorGenero[];
  ventas_ultimos_7_dias: VentasDiarias[];
  ventas_mensuales: VentasMensuales[];
  stock_por_categoria: StockPorCategoria[];
  clientes_mayor_deuda: ClienteMayorDeuda[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtener todas las estadísticas del dashboard
   */
  getDashboardCompleto(): Observable<any> {
    return this.apiService.get('dashboard');
  }

  /**
   * Obtener solo resumen general
   */
  getResumenGeneral(): Observable<any> {
    return this.apiService.get('dashboard/resumen');
  }

  /**
   * Obtener estadísticas de ventas
   */
  getEstadisticasVentas(): Observable<any> {
    return this.apiService.get('dashboard/ventas');
  }

  /**
   * Obtener productos más vendidos
   */
  getProductosMasVendidos(limite: number = 10): Observable<any> {
    return this.apiService.get(`dashboard/productos-mas-vendidos?limite=${limite}`);
  }
}