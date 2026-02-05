import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/* Angular Material */
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-agregar-productoscomponent',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './agregar-productoscomponent.html',
  styleUrl: './agregar-productoscomponent.scss',
})
export class AgregarProductoscomponent implements OnInit {

  /** FORMULARIO */
  formAgregar!: FormGroup;

  /** MODO */
  modoFormulario: 'agregar' | 'editar' = 'agregar';

  /** LISTA DE PRODUCTOS Y EDICIÓN */
  listaProductos: any[] = [];
  idEdicion: number | null = null;

  /** DATA MOCK */
  categorias = [
    { id: 1, nombre: 'Camisetas' },
    { id: 2, nombre: 'Pantalones' },
    { id: 3, nombre: 'Gorras' },
  ];

  tallas = ['XS', 'S', 'M', 'L', 'XL'];

  proveedores = [
    { id: 1, nombre: 'Proveedor A' },
    { id: 2, nombre: 'Proveedor B' },
    { id: 3, nombre: 'Proveedor C' },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.crearFormulario();
    // Cargar de LocalStorage para persistencia
    const guardados = localStorage.getItem('mis_productos');
    if (guardados) {
      this.listaProductos = JSON.parse(guardados);
    }
  }

  crearFormulario(): void {
    this.formAgregar = this.fb.group({
      nombre: ['', Validators.required],
      categoria: ['', Validators.required],
      talla: ['', Validators.required],
      color: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      proveedor: ['', Validators.required],
    });
  }

  /** GUARDAR PRODUCTO */
  onSubmit(): void {
    if (this.formAgregar.invalid) {
      this.formAgregar.markAllAsTouched();
      return;
    }

    const producto = this.formAgregar.value;

    if (this.modoFormulario === 'agregar') {
      // Crear nuevo con ID único
      producto.id = Date.now();
      this.listaProductos.push(producto);
    } else {
      // Editar existente
      const index = this.listaProductos.findIndex(p => p.id === this.idEdicion);
      if (index !== -1) {
        this.listaProductos[index] = { ...producto, id: this.idEdicion };
      }
      this.modoFormulario = 'agregar';
      this.idEdicion = null;
    }

    // Actualizar LocalStorage
    localStorage.setItem('mis_productos', JSON.stringify(this.listaProductos));
    
    // Limpiar formulario para el siguiente producto
    this.formAgregar.reset({
      cantidad: 0,
      precioCompra: 0,
      precioVenta: 0
    });
  }

  /** CARGAR PARA EDITAR EN EL MISMO FORMULARIO */
  cargarProducto(producto: any): void {
    this.modoFormulario = 'editar';
    this.idEdicion = producto.id;
    this.formAgregar.patchValue(producto);
    // Hacer scroll hacia arriba para ver el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminarProducto(id: number): void {
    this.listaProductos = this.listaProductos.filter(p => p.id !== id);
    localStorage.setItem('mis_productos', JSON.stringify(this.listaProductos));
  }
}