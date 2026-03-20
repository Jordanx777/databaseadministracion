// src/app/@theme/services/Proveedores.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Proveedor {
  id?: number;
  nombre: string;
  observaciones?: string;
  nit: string;
  correo_electronico: string;
  telefono?: string;
  ciudad?: string;
  estado?: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtener todos los proveedores
   */
  getProveedores(): Observable<any> {
    return this.apiService.get('proveedores');
  }

  /**
   * Obtener un proveedor por ID
   */
  getProveedor(id: number): Observable<any> {
    return this.apiService.get(`proveedores/${id}`);
  }

  /**
   * Crear un nuevo proveedor
   */
  crearProveedor(proveedor: Proveedor): Observable<any> {
    return this.apiService.post('proveedores', proveedor);
  }

  /**
   * Actualizar un proveedor
   */
  actualizarProveedor(id: number, proveedor: Proveedor): Observable<any> {
    return this.apiService.put(`proveedores/${id}`, proveedor);
  }

  /**
   * Eliminar un proveedor
   */
  eliminarProveedor(id: number): Observable<any> {
    return this.apiService.delete(`deleteproveedores/${id}`);
  }

  /**
   * Obtener solo proveedores activos
   */
  getProveedoresActivos(): Observable<any> {
    return this.apiService.get('proveedores/activos');
  }
}