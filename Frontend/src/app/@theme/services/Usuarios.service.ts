import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Usuario {
  id_usuario?: number;
  nombre: string;
  apellido?: string;
  correo: string;
  telefono?: string;
  direccion?: string;
  id_rol: number;
  rol_nombre?: string;
  activo?: boolean;
  ultimo_acceso?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface CreateUsuarioData {
  nombre: string;
  apellido?: string;
  correo: string;
  password: string;
  telefono?: string;
  direccion?: string;
  id_rol: number;
  activo?: boolean;
}

export interface UsuariosFilters {
  search?:   string;
  activo?:   string;   // '' | 'true' | 'false'
  id_rol?:   number | '';
  page?:     number;
  per_page?: number;
}

export interface PaginatedResult {
  data:      Usuario[];
  total:     number;
  page:      number;
  per_page:  number;
  last_page: number;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {

  constructor(private apiService: ApiService) {}

  getUsuarios(filters: UsuariosFilters = {}): Observable<any> {
    const params = new URLSearchParams();
    if (filters.search)   params.set('search',   filters.search);
    if (filters.activo !== undefined && filters.activo !== '')
                          params.set('activo',   filters.activo);
    if (filters.id_rol)   params.set('id_rol',   String(filters.id_rol));
    if (filters.page)     params.set('page',     String(filters.page));
    if (filters.per_page) params.set('per_page', String(filters.per_page));

    const query = params.toString();
    return this.apiService.get(`usuarios${query ? '?' + query : ''}`);
  }

  getUsuario(id: number): Observable<any> {
    return this.apiService.get(`usuarios/${id}`);
  }

  createUsuario(data: CreateUsuarioData): Observable<any> {
    return this.apiService.post('usuarios/crear', data);
  }

  updateUsuario(id: number, data: Partial<Usuario>): Observable<any> {
    return this.apiService.put(`usuarios/actualizar/${id}`, data);
  }

  changeRol(id: number, id_rol: number): Observable<any> {
    return this.apiService.put(`usuarios/cambiarrol/${id}`, { id_rol });
  }

  toggleActivo(id: number, activo: boolean): Observable<any> {
    return this.apiService.put(`usuarios/toggle/${id}`, { activo });
  }

  deleteUsuario(id: number): Observable<any> {
    return this.apiService.delete(`usuarios/eliminar/${id}`);
  }
}