import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface Cliente {
  id: number;
  nombre: string;
  apodo?: string;
  telefono?: string;
  direccion?: string;
  referencia?: string;
  limite_credito: number;
  tipo: 'regular' | 'ocasional';
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientesService {

  constructor(private apiService: ApiService) {}

  getAll(){ 
    return this.apiService.get<Cliente[]>(`clientes`);
  }

  create(data: Partial<Cliente>){ 
    return this.apiService.post<Cliente>(`clientes/agregar`, data);
  }

  update(id: number, data: Partial<Cliente>){ 
    return this.apiService.put<Cliente>(`clientes/actualizar/${id}`, data); 
  }

  delete(id: number){
    return this.apiService.delete(`clientes/eliminar/${id}`); 
  }
}