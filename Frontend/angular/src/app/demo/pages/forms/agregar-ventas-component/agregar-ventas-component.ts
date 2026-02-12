import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

/* Angular Material */
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-agregar-ventas-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    /* Material */
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  templateUrl: './agregar-ventas-component.html',
  styleUrl: './agregar-ventas-component.scss',
})
export class AgregarVentasComponent implements OnInit {

  /** FORMULARIO */
  formVentas!: FormGroup;

  /** ESTADOS */
  cargando = false;
  cargandoDatos = true;

  /** DATA (mock por ahora) */
  productos: any[] = [];
  clientes: any[] = [];
  metodosPago = ['Efectivo', 'Transferencia', 'Tarjeta', 'Nequi', 'Daviplata'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.crearFormulario();
    this.cargarDatosIniciales();
    this.escucharCambiosTotal();
  }

  /** CREAR FORMULARIO */
  crearFormulario(): void {
    this.formVentas = this.fb.group({
      producto_id: ['', Validators.required],
      cliente_id: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
      total: [{ value: 0, disabled: true }],
      metodo_pago: ['', Validators.required],
      fecha: [new Date(), Validators.required],
      observaciones: ['']
    });
  }

  /** CALCULAR TOTAL AUTOMÁTICO */
  escucharCambiosTotal(): void {
    this.formVentas.get('cantidad')?.valueChanges.subscribe(() => this.calcularTotal());
    this.formVentas.get('precio_unitario')?.valueChanges.subscribe(() => this.calcularTotal());
  }

  calcularTotal(): void {
    const cantidad = this.formVentas.get('cantidad')?.value || 0;
    const precio = this.formVentas.get('precio_unitario')?.value || 0;
    this.formVentas.get('total')?.setValue(cantidad * precio, { emitEvent: false });
  }

  /** CARGAR DATA INICIAL */
  cargarDatosIniciales(): void {
    this.cargandoDatos = true;

    // Simulación backend
    setTimeout(() => {
      this.productos = [
        { id: 1, nombre: 'Camiseta Oversize' },
        { id: 2, nombre: 'Pantalón Cargo' },
        { id: 3, nombre: 'Gorra Street' }
      ];

      this.clientes = [
        { id: 1, nombre: 'Cliente ocasional' },
        { id: 2, nombre: 'Juan Pérez' },
        { id: 3, nombre: 'María Gómez' }
      ];

      this.cargandoDatos = false;
      this.cdr.detectChanges();
    }, 800);
  }

  /** GUARDAR VENTA */
  onSubmit(): void {
    if (this.formVentas.invalid) {
      this.formVentas.markAllAsTouched();
      this.mostrarMensaje('Completa los campos obligatorios', 'warning');
      return;
    }

    this.cargando = true;

    const venta = this.formVentas.getRawValue();
    console.log('Venta a guardar:', venta);

    // Simulación guardado
    setTimeout(() => {
      this.cargando = false;
      this.mostrarMensaje('Venta registrada correctamente', 'success');

      this.formVentas.reset({
        cantidad: 1,
        precio_unitario: 0,
        total: 0,
        fecha: new Date()
      });

      this.cdr.detectChanges();
    }, 1000);
  }

  /** CANCELAR */
  cancelar(): void {
    this.router.navigate(['component/ventas']);
  }

  /** MENSAJES */
  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}
