// src/app/@theme/services/Subcategorias.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Subcategoria {
  id?: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubcategoriasService {

  constructor(private apiService: ApiService) {}

  /**
   * Obtener todas las subcategorías
   */
  getSubcategorias(): Observable<any> {
    return this.apiService.get('subcategorias');
  }

  /**
   * Obtener subcategorías de una categoría específica
   */
  getSubcategoriasPorCategoria(categoriaId: number): Observable<any> {
    return this.apiService.get(`subcategorias/categoria/${categoriaId}`);
  }

  /**
   * Obtener una subcategoría por ID
   */
  getSubcategoria(id: number): Observable<any> {
    return this.apiService.get(`subcategorias/${id}`);
  }

  /**
   * Crear una nueva subcategoría
   */
  createSubcategoria(subcategoria: Subcategoria): Observable<any> {
    return this.apiService.post('subcategorias', subcategoria);
  }

  /**
   * Actualizar una subcategoría
   */
  updateSubcategoria(id: number, subcategoria: Subcategoria): Observable<any> {
    return this.apiService.put(`subcategorias/${id}`, subcategoria);
  }

  /**
   * Eliminar una subcategoría
   */
  deleteSubcategoria(id: number): Observable<any> {
    return this.apiService.delete(`subcategorias/${id}`);
  }

  /**
   * Obtener solo subcategorías activas
   */
  getSubcategoriasActivas(): Observable<any> {
    return this.apiService.get('subcategorias/activas');
  }

  /**
   * Obtener subcategorías activas de una categoría
   */
  getSubcategoriasActivasPorCategoria(categoriaId: number): Observable<any> {
    return this.apiService.get(`subcategorias/categoria/${categoriaId}/activas`);
  }
}