// src/app/@theme/services/Categorias.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Categoria {
  id?: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtener todas las categorías
   */
  getCategorias(): Observable<any> {
    return this.apiService.get('categorias');
  }

  /**
   * Obtener una categoría por ID
   */
  getCategoria(id: number): Observable<any> {
    return this.apiService.get(`categorias/${id}`);
  }

  /**
   * Crear una nueva categoría
   */
  createCategoria(categoria: Categoria): Observable<any> {
    return this.apiService.post('categorias', categoria);
  }

  /**
   * Actualizar una categoría
   */
  updateCategoria(id: number, categoria: Categoria): Observable<any> {
    return this.apiService.put(`categorias/${id}`, categoria);
  }

  /**
   * Eliminar una categoría
   */
  deleteCategoria(id: number): Observable<any> {
    return this.apiService.delete(`categorias/${id}`);
  }

  /**
   * Obtener solo categorías activas
   */
  getCategoriasActivas(): Observable<any> {
    return this.apiService.get('categorias/activas');
  }
}