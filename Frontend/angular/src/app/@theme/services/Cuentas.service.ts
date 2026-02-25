// services/cuenta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';


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

  constructor(private apiService: ApiService) {}

  // 1. Ver todas las deudas activas
  listarCuentasPorCobrar() {
    return this.apiService.get<Cuenta[]>('cuentas/por-cobrar');
  }

  // 2. Ver deuda de un cliente específico (registrado)
  obtenerDeudaClienteRegistrado(clienteId: number){
    return this.apiService.get<Cuenta>(`cuentas/cliente/${clienteId}`);
  }

  // 3. Buscar deuda de cliente ocasional por nombre
  buscarDeudaClienteOcasional(nombre: string) {
    return this.apiService.get<Cuenta[]>(`cuentas/buscar?nombre=${encodeURIComponent(nombre)}`);
  }

  // 4. Ver historial completo de un cliente
  obtenerHistorialCliente(clienteId: number) {
    return this.apiService.get<HistorialCliente[]>(`cuentas/historial/${clienteId}`);
  }
  
  // 5. Ver historial activo de un cliente
  obtenerHistorialClienteActivos(clienteId: number) {
    return this.apiService.get<HistorialCliente[]>(`cuentas/historial/activos/${clienteId}`);
  }

  // 6. Ver cuánto debe un cliente (todas sus ventas)
  obtenerResumenDeuda(clienteId: number): Observable<any> {
    return this.apiService.get<any>(`cuentas/resumen/${clienteId}`);
  }
}