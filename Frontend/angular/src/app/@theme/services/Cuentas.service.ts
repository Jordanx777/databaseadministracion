// services/cuenta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiService } from './api.service';


export interface CuentasFiltros {
  page?:         number;
  per_page?:     number;
  buscar?:       string;
  tipo_cliente?: string;
  mora?:         string; // 'baja' | 'media' | 'alta' | ''
}

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
  // ── Listar con paginación y filtros ───────────────────
  listarCuentasPorCobrar(filtros: CuentasFiltros = {}): Observable<any> {
    const params = new URLSearchParams();
    if (filtros.page)         params.set('page',         String(filtros.page));
    if (filtros.per_page)     params.set('per_page',     String(filtros.per_page));
    if (filtros.buscar)       params.set('buscar',       filtros.buscar);
    if (filtros.tipo_cliente) params.set('tipo_cliente', filtros.tipo_cliente);
    if (filtros.mora)         params.set('mora',         filtros.mora);
 
    const query = params.toString();
    return this.apiService.get(`cuentas/por-cobrar${query ? '?' + query : ''}`);
  }

  // 2. Ver deuda de un cliente específico (registrado)
  obtenerDeudaClienteRegistrado(clienteId: number){
    return this.apiService.get<Cuenta>(`cuentas/cliente/${clienteId}`);
  }

  // 3. Buscar deuda de cliente ocasional por nombre
  buscarDeudaClienteOcasional(nombre: string) {
    return this.apiService.get<Cuenta[]>(`cuentas/buscar?nombre=${encodeURIComponent(nombre)}`);
  }

  // ── Historial completo ────────────────────────────────
  obtenerHistorialCliente(clienteId: number): Observable<{ success: boolean; data: HistorialCliente[] }> {
    return this.apiService.get(`cuentas/historial/${clienteId}`);
  }

  // ── Historial activo ──────────────────────────────────
  obtenerHistorialClienteActivos(clienteId: number): Observable<{ success: boolean; data: HistorialCliente[] }> {
    return this.apiService.get(`cuentas/historial/activos/${clienteId}`);
  }

  // 6. Ver cuánto debe un cliente (todas sus ventas)
  obtenerResumenDeuda(clienteId: number): Observable<any> {
    return this.apiService.get<any>(`cuentas/resumen/${clienteId}`);
  }
}