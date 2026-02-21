// services/cuenta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


// models/cuenta.model.ts
export interface Cuenta {
  cliente_id: number | null;
  nombre: string;
  apodo: string | null;
  referencia: string | null;
  telefono: string | null;
  tipo_cliente: 'registrado' | 'ocasional';
  total_ventas: number;
  total_pagado: number;
  saldo_pendiente: number;
  num_facturas: number;
  ultima_compra: Date;
  ultimo_pago: Date | null;
  dias_mora: number;
}


// models/historial-cliente.model.ts
export interface HistorialCliente {
  venta_id: number;
  numero_factura: string;
  fecha_venta: Date;
  cliente_nombre: string;
  monto_venta: number;
  tipo_pago: string;
  estado_venta: string;
  total_pagado: number;
  saldo_pendiente: number;
  productos: Array<{
    producto: string;
    marca: string;
    talla: string;
    color: string;
    cantidad: number;
    precio: number;
  }>;
  pagos: Array<{
    fecha: Date;
    monto: number;
    metodo: string;
    referencia: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class CuentaService {
  private apiUrl = `${environment.apiUrl}/cuentas`;

  constructor(private http: HttpClient) { }

  // 1. Ver todas las deudas activas
  listarCuentasPorCobrar(): Observable<Cuenta[]> {
    return this.http.get<Cuenta[]>(`${this.apiUrl}/por-cobrar`);
  }

  // 2. Ver deuda de un cliente específico (registrado)
  obtenerDeudaClienteRegistrado(clienteId: number): Observable<Cuenta> {
    return this.http.get<Cuenta>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // 3. Buscar deuda de cliente ocasional por nombre
  buscarDeudaClienteOcasional(nombre: string): Observable<Cuenta[]> {
    return this.http.get<Cuenta[]>(`${this.apiUrl}/buscar?nombre=${nombre}`);
  }

  // 4. Ver historial completo de un cliente
  obtenerHistorialCliente(clienteId: number): Observable<HistorialCliente[]> {
    return this.http.get<HistorialCliente[]>(`${this.apiUrl}/historial/${clienteId}`);
  }

  // 6. Ver cuánto debe un cliente (todas sus ventas)
  obtenerResumenDeuda(clienteId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumen/${clienteId}`);
  }
}