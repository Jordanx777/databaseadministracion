// services/pago.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';



// models/pago.model.ts
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


@Injectable({
  providedIn: 'root'
})

export class PagoService {

  constructor(private apiService: ApiService) {}

  // 5. Registrar un pago
  registrarPago(pago: Pago): Observable<any> {
    return this.apiService.post('/pagos', pago);
  }

  // Listar ventas
  // listarVentas(clienteId: number): Observable<any> {
  //   const params = { cliente_id: clienteId.toString() };
  //   return this.apiService.get('/ventas', { params });
  // }

  // Obtener una venta
  obtenerVenta(id: number): Observable<any> {
    return this.apiService.get(`/ventas/${id}`);
  }

  // Eliminar un pago (por si se registró mal)
  eliminarPago(pagoId: number): Observable<any> {
    return this.apiService.delete(`/pagos/${pagoId}`);
  }
}