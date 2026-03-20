import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Servicios
import { ProductosService } from 'src/app/@theme/services/Productos.service';

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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './agregar-proveedores-component.html',
  styleUrl: './agregar-proveedores-component.scss',
})
export class AgregarProveedoresComponent implements OnInit {

  proveedorForm!: FormGroup;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.crearFormulario();
  }

  crearFormulario(): void {
    this.proveedorForm = this.fb.group({
      nombre: ['', Validators.required],
      nit: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [''],
      ciudad: [''],
      observaciones: [''],
      estado: [true, Validators.required],
    });
  }

  guardarProveedor(): void {
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos obligatorios', 'warning');
      return;
    }

    this.cargando = true;
    const proveedor = { ...this.proveedorForm.value };

    // Convertir estado a booleano si viene como string
    if (typeof proveedor.estado === 'string') {
      proveedor.estado = proveedor.estado === 'true' || proveedor.estado === 'activo';
    }

    this.productosService.crearProveedor(proveedor).subscribe({
      next: (response) => {
        
        if (this.verificarExito(response)) {
          this.mostrarMensaje('Proveedor creado exitosamente', 'success');
          
          // Redirigir después de un pequeño delay
          setTimeout(() => {
            this.router.navigate(['component/proveedor']);
          }, 500);
        } else {
          const mensaje = response.message || 'Error al crear el proveedor';
          this.mostrarMensaje(mensaje, 'error');
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al crear proveedor:', error);
        
        let mensajeError = 'Error al crear el proveedor';
        
        // Manejar errores específicos
        if (error.error?.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }
        
        // Errores comunes de duplicados
        if (mensajeError.includes('nit')) {
          mensajeError = 'El NIT ya está registrado';
        } else if (mensajeError.includes('correo')) {
          mensajeError = 'El correo electrónico ya está registrado';
        }
        
        this.mostrarMensaje(mensajeError, 'error');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** VERIFICAR ÉXITO DE LA RESPUESTA */
  private verificarExito(response: any): boolean {
    if (!response) return false;
    if (response.hasOwnProperty('success')) return response.success === true;
    if (response.id || response.data?.id) return true;
    return true;
  }

  cancelar(): void {
    if (this.proveedorForm.dirty) {
      if (confirm('¿Está seguro de cancelar? Se perderán los datos no guardados.')) {
        this.router.navigate(['/proveedores']);
      }
    } else {
      this.router.navigate(['/proveedores']);
    }
  }

  limpiarFormulario(): void {
    this.proveedorForm.reset({
      estado: true,
    });
  }

  /** MOSTRAR MENSAJE */
  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}