import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

/* Angular Material */
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

/* Servicios */
import { CuentaService, Cuenta, HistorialCliente } from 'src/app/@theme/services/Cuentas.service';
import { PagoService, Pago } from 'src/app/@theme/services/Pagos.services';

@Component({
  selector: 'app-cuentas-cobrar',
  standalone: true,
  templateUrl: './cuentas-cobrar-component.html',
  styleUrls: ['./cuentas-cobrar-component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
  ]
})
export class CuentasCobrarComponent implements OnInit, AfterViewInit {

  /* ===== COLUMNAS ===== */
  displayedColumns: string[] = [
    'nombre',
    'tipo_cliente',
    'telefono',
    'total_ventas',
    'total_pagado',
    'saldo_pendiente',
    'num_facturas',
    'dias_mora',
    'ultima_compra',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Cuenta>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('modalPago') modalPago!: TemplateRef<any>;
  @ViewChild('modalHistorial') modalHistorial!: TemplateRef<any>;

  /* ===== MODALES ===== */
  dialogRefPago!: MatDialogRef<any>;
  dialogRefHistorial!: MatDialogRef<any>;

  /* ===== FORMULARIO PAGO ===== */
  formPago!: FormGroup;
  cuentaSeleccionada: Cuenta | null = null;
  historialCliente: HistorialCliente[] = [];

  metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'nequi', label: 'Nequi' },
    { value: 'daviplata', label: 'Daviplata' },
    { value: 'transferencia', label: 'Transferencia bancaria' },
    { value: 'tarjeta', label: 'Tarjeta' },
  ];

  /* ===== LOADING ===== */
  cargando = true;
  cargandoModal = false;
  cargandoHistorial = false;

  /* ===== TOTALES ===== */
  totalDeuda = 0;

  constructor(
    private cuentaService: CuentaService,
    private pagoService: PagoService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.crearFormularioPago();
    this.configurarFiltro();
  }

  ngOnInit(): void {
    this.cargarCuentas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ─── FORMULARIO ────────────────────────────────────────────────────────────

  crearFormularioPago(): void {
    this.formPago = this.fb.group({
      venta_id: ['', Validators.required],
      monto: [0, [Validators.required, Validators.min(0.01)]],
      metodo_pago: ['efectivo', Validators.required],
      referencia: [''],
      notas: ['']
    });
  }

  // ─── CARGAR DATOS ──────────────────────────────────────────────────────────

  cargarCuentas(): void {
    this.cargando = true;
    this.cuentaService.listarCuentasPorCobrar().subscribe({
      next: (response: any) => {
        const cuentas = this.extraerDatos(response);
        this.dataSource.data = cuentas;
        this.calcularTotales(cuentas);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar cuentas:', error);
        this.mostrarMensaje('Error al cargar las cuentas por cobrar', 'error');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extraerDatos(response: any): Cuenta[] {
    if (response?.data) return Array.isArray(response.data) ? response.data : [];
    if (Array.isArray(response)) return response;
    return [];
  }

  calcularTotales(cuentas: Cuenta[]): void {
    this.totalDeuda = cuentas.reduce((sum, c) => sum + Number(c.saldo_pendiente), 0);
  }

  // ─── FILTRO ────────────────────────────────────────────────────────────────

  configurarFiltro(): void {
    this.dataSource.filterPredicate = (data: Cuenta, filter: string) => {
      const texto = `
        ${data.nombre || ''}
        ${data.apodo || ''}
        ${data.telefono || ''}
        ${data.referencia || ''}
      `.toLowerCase();
      return texto.includes(filter);
    };
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.paginator) this.paginator.firstPage();
  }

  // ─── MODAL REGISTRAR PAGO ──────────────────────────────────────────────────

  abrirModalPago(cuenta: Cuenta): void {
    this.cuentaSeleccionada = cuenta;

    // Pre-llenar el monto con el saldo pendiente
    this.formPago.patchValue({
      monto: cuenta.saldo_pendiente,
      metodo_pago: 'efectivo',
      referencia: '',
      notas: ''
    });

    this.dialogRefPago = this.dialog.open(this.modalPago, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: false
    });
  }

  cerrarModalPago(): void {
    this.dialogRefPago?.close();
    this.formPago.reset();
    this.cuentaSeleccionada = null;
  }

  registrarPago(): void {
    if (this.formPago.invalid || !this.cuentaSeleccionada) {
      this.formPago.markAllAsTouched();
      this.mostrarMensaje('Complete todos los campos requeridos', 'warning');
      return;
    }

    const monto = Number(this.formPago.value.monto);
    if (monto > this.cuentaSeleccionada.saldo_pendiente) {
      this.mostrarMensaje(
        `El monto no puede ser mayor al saldo pendiente ($${this.cuentaSeleccionada.saldo_pendiente.toFixed(2)})`,
        'warning'
      );
      return;
    }

    this.cargandoModal = true;

    // NOTA: Aquí falta saber el venta_id específico
    // Habría que agregarlo en la interfaz Cuenta o hacer un endpoint que devuelva
    // la venta_id más antigua con saldo pendiente de este cliente
    const pago: Pago = {
      venta_id: 0, // ❗ ESTO DEBE VENIR DEL BACKEND
      monto: monto,
      metodo_pago: this.formPago.value.metodo_pago,
      referencia: this.formPago.value.referencia || undefined,
      notas: this.formPago.value.notas || undefined,
    };

    this.pagoService.registrarPago(pago).subscribe({
      next: (response) => {
        this.mostrarMensaje('Pago registrado exitosamente', 'success');
        this.cerrarModalPago();
        this.cargarCuentas();
        this.cargandoModal = false;
      },
      error: (error) => {
        console.error('Error al registrar pago:', error);
        this.mostrarMensaje('Error al registrar el pago', 'error');
        this.cargandoModal = false;
      }
    });
  }

  // ─── MODAL HISTORIAL ───────────────────────────────────────────────────────

  verHistorial(cuenta: Cuenta): void {
    if (!cuenta.cliente_id) {
      this.mostrarMensaje('Solo se puede ver historial de clientes registrados', 'warning');
      return;
    }

    this.cuentaSeleccionada = cuenta;
    this.cargandoHistorial = true;

    this.dialogRefHistorial = this.dialog.open(this.modalHistorial, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false
    });

    this.cuentaService.obtenerHistorialCliente(cuenta.cliente_id).subscribe({
      next: (response: any) => {
        // this.historialCliente = this.extraerDatos(response);
        this.historialCliente = Array.isArray(response?.data) ? response.data : [];
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.mostrarMensaje('Error al cargar el historial del cliente', 'error');
        this.cargandoHistorial = false;
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalHistorial(): void {
    this.dialogRefHistorial?.close();
    this.historialCliente = [];
    this.cuentaSeleccionada = null;
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  getMoraColor(dias: number): string {
    if (dias <= 7) return 'mora-baja';
    if (dias <= 30) return 'mora-media';
    return 'mora-alta';
  }

  getTipoClienteBadge(tipo: string): string {
    return tipo === 'registrado' ? 'badge-registrado' : 'badge-ocasional';
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}