// src/app/@theme/services/Marcas.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Marca {
  id?: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarcasService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtener todas las marcas
   */
  getMarcas(): Observable<any> {
    return this.apiService.get('marcas');
  }

  /**
   * Obtener una marca por ID
   */
  getMarca(id: number): Observable<any> {
    return this.apiService.get(`marcas/${id}`);
  }

  /**
   * Crear una nueva marca
   */
  createMarca(marca: Marca): Observable<any> {
    return this.apiService.post('marcas', marca);
  }

  /**
   * Actualizar una marca
   */
  updateMarca(id: number, marca: Marca): Observable<any> {
    return this.apiService.put(`marcas/${id}`, marca);
  }

  /**
   * Eliminar una marca
   */
  deleteMarca(id: number): Observable<any> {
    return this.apiService.delete(`marcas/${id}`);
  }

  /**
   * Obtener solo marcas activas
   */
  getMarcasActivas(): Observable<any> {
    return this.apiService.get('marcas/activas');
  }
}