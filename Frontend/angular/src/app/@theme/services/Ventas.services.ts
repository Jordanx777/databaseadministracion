import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';

// ===== INTERFAZ PARA CREAR VENTAS ===== 
export interface VentaCrear {
  usuario_id: number;
  cliente_id?: number | null;
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  cliente_referencia?: string | null;
  subtotal: number;
  descuento: number;
  total: number;
  tipo_pago: 'contado' | 'credito' | 'mixto';
  notas?: string | null;
  detalles: DetalleVentaCrear[];
  pagos?: PagoInicialCrear[];
}

export interface DetalleVentaCrear {
  producto_id: number;
  variante_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  talla_vendida: string;
  color_vendido: string;
  genero_vendido?: string;
}

export interface PagoInicialCrear {
  monto: number;
  metodo_pago: 'efectivo' | 'nequi' | 'transferencia' | 'tarjeta' | 'daviplata';
  referencia?: string;
  notas?: string;
}

// ===== INTERFAZ PARA RECIBIR VENTAS ===== 
export interface VentaCompleta {
  venta_id: number;
  numero_factura: string;
  fecha_venta: Date;
  venta_total: number;
  venta_estado: 'pendiente' | 'pagada' | 'cancelada';
  tipo_pago: 'contado' | 'credito' | 'mixto';
  cliente_nombre: string;
  cliente_apodo: string | null;
  cliente_id: number | null;
  tipo_cliente: 'registrado' | 'ocasional';
  total_pagado: number;
  saldo_pendiente: number;
  productos: Array<{
    detalle_id: number;
    producto_id: number;
    producto_nombre: string;
    marca_nombre: string;
    talla: string;
    color: string;
    genero: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  pagos: Array<{
    pago_id: number;
    monto: number;
    fecha: Date;
    metodo: string;
    referencia: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {

  constructor(private apiService: ApiService) {}

  // Crear venta
  // ✅ AHORA (CORRECTO):
crearVenta(venta: VentaCrear): Observable<any> {
  return this.apiService.post('ventas', venta);  
}

  /**
   * Obtener todas las ventas con filtros opcionales
   */
  obtenerTodas(filtros?: any): Observable<any> {
    let params = new URLSearchParams();
    
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });
    }
    
    return this.apiService.get(`ventas?${params.toString()}`);
  }

  /**
   * Obtener venta completa por ID
   */
  obtenerVentaCompletaPorId(id: number): Observable<{success: boolean, data: VentaCompleta}> {
    return this.apiService.get<any>(`ventas/completas/${id}`);
  }

  /**
   * Obtener ventas completas (con detalles y pagos)
   */
  obtenerVentasCompletas(filtros?: any): Observable<{success: boolean, data: VentaCompleta[], total: number}> {
      let params = new URLSearchParams();
    if (filtros) {
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });
    }
    return this.apiService.get<any>(`ventas/completas?${params.toString()}`);
  }

obtenerPorId(id: number): Observable<any> {
    return this.apiService.get<any>(`ventas/${id}`);
  }

  // Obtener una venta
  obtenerVenta(id: number): Observable<any> {
    return this.apiService.get<any>(`ventas/${id}`);
  }

  // Actualizar estado de venta
//   actualizarEstado(id: number, estado: string): Observable<any> {
//     return this.apiService.patch<any>(`${this.apiUrl}/${id}/estado`, { estado });
//   }

  // Cancelar venta
  // cancelarVenta(id: number): Observable<any> {
  //   return this.apiService.delete<any>(`${this.apiUrl}/${id}`);
  // }
  cancelar(id: number): Observable<any> {
    return this.apiService.put<any>(`ventas/cancelar/${id}`, {});
  }

  // ver el historial en genera TODO
  getHistorialCompleto(): Observable<any> {
    return this.apiService.get<any>('cuentas/historial/completo');
  }
}