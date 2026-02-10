// src/app/services/productos.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Producto {
  id?: number;
  nombre: string;
  categoria_id: number;
  subcategoria_id?: number;
  marca_id: number;
  proveedor_id: number;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  talla: string;
  color: string;
  genero?: string;
  imagen_url?: string;
  estado?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activo: boolean;
}

export interface Subcategoria {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Marca {
  id: number;
  nombre: string;
}

export interface Proveedor {
  id?: number;
  nombre: string;
  observaciones?: string;
  nit: string;
  correo_electronico: string;
  telefono?: string;
  ciudad?: string;
  estado?: boolean;
  fecha_llegada?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  constructor(private apiService: ApiService) {}

  // PRODUCTOS
  getProductos(): Observable<any> {
    return this.apiService.get('productos');
  }

  getProducto(id: number): Observable<any> {
    return this.apiService.get(`productos/${id}`);
  }

  crearProducto(producto: Producto): Observable<any> {
    return this.apiService.post('productos', producto);
  }

  actualizarProducto(id: number, producto: Producto): Observable<any> {
    return this.apiService.put(`productos/${id}`, producto);
  }

  eliminarProducto(id: number): Observable<any> {
    return this.apiService.delete(`productos/${id}`);
  }

  // CATEGORÍAS
  getCategorias(): Observable<any> {
    return this.apiService.get('categorias');
  }

  // SUBCATEGORÍAS
  getSubcategorias(): Observable<any> {
    return this.apiService.get('subcategorias');
  }

  getSubcategoriasPorCategoria(categoriaId: number): Observable<any> {
    return this.apiService.get(`subcategorias/categoria/${categoriaId}`);
  }

  // MARCAS
  getMarcas(): Observable<any> {
    return this.apiService.get('marcas');
  }

  // PROVEEDORES
getProveedores(): Observable<any> {
  return this.apiService.get('proveedores');
}

getProveedor(id: number): Observable<any> {
  return this.apiService.get(`proveedores/${id}`);
}

crearProveedor(proveedor: any): Observable<any> {
  return this.apiService.post('proveedores', proveedor);
}

actualizarProveedor(id: number, proveedor: any): Observable<any> {
  return this.apiService.put(`proveedores/${id}`, proveedor);
}

eliminarProveedor(id: number): Observable<any> {
  return this.apiService.delete(`proveedores/${id}`);
}

getProveedoresActivos(): Observable<any> {
  return this.apiService.get('proveedores/activos');
}
}