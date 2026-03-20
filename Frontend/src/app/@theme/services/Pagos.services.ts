// src/app/@theme/services/Pagos.services.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Pago {
  id?: number;
  venta_id: number;
  monto: number;
  fecha_pago?: Date;
  metodo_pago: 'efectivo' | 'nequi' | 'transferencia' | 'tarjeta' | 'daviplata';
  referencia?: string;
  notas?: string;
  registrado_por?: number;
}

export interface PagoResponse {
  success: boolean;
  message: string;
  data?: {
    pago_id: number;
    venta_actualizada: {
      venta_id: number;
      total: number;
      total_pagado: number;
      saldo_pendiente: number;
      nuevo_estado: string;
    }
  };
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {

  constructor(private apiService: ApiService) {}
  /**
   * Registrar un nuevo pago
   */
  registrarPago(pago: Pago): Observable<PagoResponse> {
    return this.apiService.post<PagoResponse>('pagos/crear', pago).pipe(
      map(response => response as PagoResponse)
    );
  }

  /**
   * Listar pagos de una venta
   */
  listarPagosPorVenta(ventaId: number): Observable<any> {
    return this.apiService.get<any>(`pagos/venta/${ventaId}`);
  }

  /**
   * Obtener un pago por ID
   */
  obtenerPago(pagoId: number): Observable<any> {
    return this.apiService.get<any>(`pagos/${pagoId}`);
  }

  /**
   * Eliminar un pago (por si se registró mal)
   */
  eliminarPago(pagoId: number): Observable<any> {
    return this.apiService.delete<any>(`pagos/eliminar/${pagoId}`);
  }
}

  
