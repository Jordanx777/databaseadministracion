import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';

export interface Venta {
  id?: number;
  numero_factura?: string;
  cliente_id?: number | null;
  cliente_nombre?: string | null;
  cliente_telefono?: string | null;
  cliente_referencia?: string | null;
  usuario_id?: number;
  fecha_venta?: Date;
  subtotal: number;
  descuento: number;
  total: number;
  tipo_pago: 'contado' | 'credito' | 'mixto';
  estado?: 'pendiente' | 'pagada' | 'cancelada';
  notas?: string;
  detalles?: DetalleVenta[];
  pagos?: PagoInicial[];
}

export interface DetalleVenta {
  producto_id: number;
  variante_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  talla_vendida: string;
  color_vendido: string;
  genero_vendido?: string;
}

export interface PagoInicial {
  monto: number;
  metodo_pago: 'efectivo' | 'nequi' | 'transferencia' | 'tarjeta' | 'daviplata';
  referencia?: string;
  notas?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private apiUrl = `${environment.apiUrl}/ventas`;

  constructor(private apiService: ApiService) {}

  // Crear venta
  crearVenta(venta: Venta): Observable<any> {
  return this.apiService.post('/ventas', venta);  
  }

  // Listar ventas
//   listarVentas(params?: any): Observable<any> {
//     return this.apiService.get<any>(this.apiUrl, { params });
//   }

  // Obtener una venta
  obtenerVenta(id: number): Observable<any> {
    return this.apiService.get<any>(`${this.apiUrl}/${id}`);
  }

  // Actualizar estado de venta
//   actualizarEstado(id: number, estado: string): Observable<any> {
//     return this.apiService.patch<any>(`${this.apiUrl}/${id}/estado`, { estado });
//   }

  // Cancelar venta
  cancelarVenta(id: number): Observable<any> {
    return this.apiService.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Ventas del día
//   ventasDelDia(fecha?: string): Observable<any> {
//     const fechaParam = fecha ? { fecha } : {};
//     return this.apiService.get<any>(`${this.apiUrl}/ventas-del-dia`, { params: fechaParam });
//   }
}