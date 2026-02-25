
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

/* Angular Material */
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

/* Servicios */
import { PagoService, Pago } from 'src/app/@theme/services/Pagos.services';
import { VentasService, VentaCompleta } from 'src/app/@theme/services/Ventas.services';
import { AuthService } from 'src/app/@theme/services/auth.service';

@Component({
  selector: 'app-registrar-pago',
  standalone: true,
  templateUrl: './registrar-pago-component.html',
  styleUrls: ['./registrar-pago-component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
  ]
})
export class RegistrarPagoComponent implements OnInit {

  formPago!: FormGroup;
  venta: VentaCompleta | null = null;
  ventaId: number = 0;
  cargando = true;
  guardando = false;

  metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: 'payments' },
    { value: 'nequi', label: 'Nequi', icon: 'phone_android' },
    { value: 'daviplata', label: 'Daviplata', icon: 'phone_android' },
    { value: 'transferencia', label: 'Transferencia bancaria', icon: 'account_balance' },
    { value: 'tarjeta', label: 'Tarjeta', icon: 'credit_card' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private pagoService: PagoService,
    private ventasService: VentasService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener venta_id de query params
    this.route.queryParams.subscribe(params => {
      this.ventaId = Number(params['venta_id']);
      
      if (this.ventaId) {
        this.crearFormulario();
        this.cargarVenta();
        this.PagosVentas();
      } else {
        this.mostrarMensaje('No se especificó una venta', 'error');
        this.router.navigate(['/component/ventas']);
      }
    });
  }

  crearFormulario(): void {
    this.formPago = this.fb.group({
      monto: [0, [Validators.required, Validators.min(0.01)]],
      metodo_pago: ['efectivo', Validators.required],
      referencia: [''],
      notas: ['']
    });
  }

  cargarVenta(): void {
    this.cargando = true;

    this.ventasService.obtenerVentaCompletaPorId(this.ventaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.venta = response.data;

          // Validar que tenga saldo pendiente
          if (this.venta.saldo_pendiente <= 0) {
            this.mostrarMensaje('Esta venta ya está completamente pagada', 'warning');
            this.router.navigate(['/component/ventas', this.ventaId]);
            return;
          }

          // Pre-llenar el monto con el saldo pendiente
          this.formPago.patchValue({
            monto: this.venta.saldo_pendiente
          });

          this.cargando = false;
          this.cdr.detectChanges();
        } else {
          this.mostrarMensaje('Venta no encontrada', 'error');
          this.router.navigate(['/component/ventas']);
        }
      },
      error: (error) => {
        console.error('Error al cargar venta:', error);
        this.mostrarMensaje('Error al cargar los datos de la venta', 'error');
        this.router.navigate(['/component/ventas']);
      }
    });
  }

  // Validar monto
  validarMonto(): boolean {
    const monto = Number(this.formPago.get('monto')?.value);

    if (monto <= 0) {
      this.mostrarMensaje('El monto debe ser mayor a cero', 'warning');
      return false;
    }

    if (this.venta && monto > this.venta.saldo_pendiente) {
      this.mostrarMensaje(
        `El monto no puede exceder el saldo pendiente (${this.formatearMoneda(this.venta.saldo_pendiente)})`,
        'warning'
      );
      return false;
    }

    return true;
  }

  
  // llamo a la funcion listarPagosPorVenta para depurar 
  PagosVentas(){
    this.pagoService.listarPagosPorVenta(this.ventaId).subscribe({
      next: (response) => {
      },
      error: (error) => {
        console.error('Error al listar pagos de la venta:', error);
      }
    });
  }

  // Registrar pago
  registrarPago(): void {
    if (this.formPago.invalid) {
      this.formPago.markAllAsTouched();
      this.mostrarMensaje('Complete todos los campos requeridos', 'warning');
      return;
    }

    if (!this.validarMonto()) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.mostrarMensaje('Sesión no válida. Inicie sesión nuevamente.', 'error');
      return;
    }

    this.guardando = true;

    const pago: Pago = {
      venta_id: this.ventaId,
      monto: Number(this.formPago.value.monto),
      metodo_pago: this.formPago.value.metodo_pago,
      referencia: this.formPago.value.referencia || undefined,
      notas: this.formPago.value.notas || undefined,
      registrado_por: currentUser.id_usuario
    };

    this.pagoService.registrarPago(pago).subscribe({
      next: (response) => {
        this.mostrarMensaje('Pago registrado exitosamente', 'success');
        
        // Redirigir al detalle de la venta
        this.router.navigate(['/component/cuentas-detalles', this.ventaId]);
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al registrar pago:', error);
        this.mostrarMensaje(
          error.error?.message || 'Error al registrar el pago',
          'error'
        );
        this.guardando = false;
      }
    });
  }

  // Cancelar
  cancelar(): void {
    if (this.venta) {
      // this.router.navigate(['/component/ventas', this.ventaId]);
      this.router.navigate(['/component/ventas']);

    } else {
      this.router.navigate(['/component/ventas']);
    }
  }

  // Helpers
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  calcularNuevoSaldo(): number {
    if (!this.venta) return 0;
    const monto = Number(this.formPago.get('monto')?.value) || 0;
    return Math.max(0, this.venta.saldo_pendiente - monto);
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}