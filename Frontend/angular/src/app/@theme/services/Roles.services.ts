import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Rol {
  id_rol?: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  constructor(private apiService: ApiService) {}

  getRoles(): Observable<any> {
    return this.apiService.get('roles');
  }

  getRol(id: number): Observable<any> {
    return this.apiService.get(`roles/${id}`);
  }

  createRol(rol: Rol): Observable<any> {
    return this.apiService.post('roles/crear', rol);
  }

  updateRol(id: number, rol: Rol): Observable<any> {
    return this.apiService.put(`roles/actualizar/${id}`, rol);
  }

  deleteRol(id: number): Observable<any> {
    return this.apiService.delete(`roles/eliminar/${id}`);
  }

  getRolesActivos(): Observable<any> {
    return this.apiService.get('roles/activos');
  }
}