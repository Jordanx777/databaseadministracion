import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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
  @ViewChild('modalHistorial') modalHistorial!: TemplateRef<any>;

  /* ===== MODALES ===== */
  dialogRefHistorial!: MatDialogRef<any>;

  /* ===== DATOS ===== */
  cuentaSeleccionada: Cuenta | null = null;
  historialCliente: HistorialCliente[] = [];

  /* ===== LOADING ===== */
  cargando = true;
  cargandoModal = false;
  cargandoHistorial = false;

  /* ===== TOTALES ===== */
  totalDeuda = 0;

  constructor(
    private cuentaService: CuentaService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.configurarFiltro();
  }

  ngOnInit(): void {
    this.cargarCuentas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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

  private extraerHistorial(response: any): HistorialCliente[] {
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

  // ─── REGISTRAR PAGO ────────────────────────────────────────────────────────

  /**
   * Registrar pago (inteligente)
   * - Si tiene 1 factura → Ir directo al formulario de pago
   * - Si tiene múltiples → Mostrar historial para elegir
   */
  registrarPago(cuenta: Cuenta): void {
    if (!cuenta.cliente_id) {
      this.mostrarMensaje('No se puede registrar pago para clientes ocasionales sin ID', 'warning');
      return;
    }

    // Decisión inteligente basada en número de facturas
    if (cuenta.num_facturas === 1) {
      // Ir directo al pago
      this.registrarPagoDirecto(cuenta);
    } else {
      // Mostrar historial para elegir
      this.verHistorialParaPago(cuenta);
    }
  }

  /**
   * Registrar pago directo (cuando solo hay 1 factura)
   */
  private registrarPagoDirecto(cuenta: Cuenta): void {
    this.cargandoModal = true;

    this.cuentaService.obtenerHistorialCliente(cuenta.cliente_id!).subscribe({
      next: (response: any) => {
        const historial = this.extraerHistorial(response);
        const ventaPendiente = historial.find(v => v.saldo_pendiente > 0);
        
        if (!ventaPendiente) {
          this.mostrarMensaje('No hay ventas pendientes para este cliente', 'warning');
          this.cargandoModal = false;
          return;
        }

        // Redirigir al formulario de pago
        this.router.navigate(['/component/registrar-pago'], {
          queryParams: {
            venta_id: ventaPendiente.venta_id,
            cliente_nombre: ventaPendiente.cliente_nombre,
            saldo: ventaPendiente.saldo_pendiente
          }
        });
        
        this.cargandoModal = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al obtener la venta del cliente', 'error');
        this.cargandoModal = false;
      }
    });
  }

  /**
   * Ver historial cuando hay múltiples facturas
   */
  private verHistorialParaPago(cuenta: Cuenta): void {
    this.mostrarMensaje(
      `${cuenta.nombre} tiene ${cuenta.num_facturas} facturas pendientes. Seleccione a cuál abonar.`,
      'warning'
    );
    this.verHistorial(cuenta);
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
        this.historialCliente = this.extraerHistorial(response);
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

  /**
   * Registrar pago desde una venta específica del historial
   */
  registrarPagoDesdeHistorial(venta: HistorialCliente): void {
    if (venta.saldo_pendiente <= 0) {
      this.mostrarMensaje('Esta venta ya está completamente pagada', 'warning');
      return;
    }

    this.cerrarModalHistorial();
    
    this.router.navigate(['/component/registrar-pago'], {
      queryParams: {
        venta_id: venta.venta_id,
        cliente_nombre: venta.cliente_nombre,
        saldo: venta.saldo_pendiente
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
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}