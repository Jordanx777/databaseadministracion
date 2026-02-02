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

@Component({
  selector: 'app-agregar-productoscomponent',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

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

  /** DATA MOCK (luego backend) */
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
  }

  /** CREA FORM */
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

  /*kfldlld */


  /** SUBMIT */
  onSubmit(): void {
    if (this.formAgregar.invalid) {
      this.formAgregar.markAllAsTouched();
      return;
    }

    const producto = this.formAgregar.value;

    if (this.modoFormulario === 'agregar') {
      console.log('Producto a guardar:', producto);
      // 👉 aquí luego va el POST al backend
    } else {
      console.log('Producto a editar:', producto);
      // 👉 aquí luego va el PUT al backend
    }
  }

  /** CARGAR PRODUCTO PARA EDITAR (FUTURO) */
  cargarProducto(producto: any): void {
    this.modoFormulario = 'editar';
    this.formAgregar.patchValue(producto);
  }
}
