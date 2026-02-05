import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-agregar-proveedores-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    // Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './agregar-proveedores-component.html',
  styleUrl: './agregar-proveedores-component.scss',
})
export class AgregarProveedoresComponent {

  proveedorForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.proveedorForm = this.fb.group({
      nombre: ['', Validators.required],
      nit: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      ciudad: ['', Validators.required],
      direccion: ['', Validators.required],
      estado: ['activo', Validators.required],
      observaciones: [''],
    });
  }

  guardarProveedor(): void {
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      return;
    }

    console.log('Proveedor a guardar:', this.proveedorForm.value);

    // 🔥 Aquí luego conectas tu backend (PHP / Laravel / API)
  }

  cancelar(): void {
    this.proveedorForm.reset({
      estado: 'activo',
    });
  }
}
