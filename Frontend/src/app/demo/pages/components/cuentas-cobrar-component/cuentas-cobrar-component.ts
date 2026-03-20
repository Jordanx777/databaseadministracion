import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy,
  ViewChild, TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

/* Angular Material */
import { MatTableModule }           from '@angular/material/table';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatCardModule }            from '@angular/material/card';
import { MatIconModule }            from '@angular/material/icon';
import { MatButtonModule }          from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule }          from '@angular/material/select';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatDividerModule }         from '@angular/material/divider';
import { MatChipsModule }           from '@angular/material/chips';

import {
  CuentaService, Cuenta, HistorialCliente, CuentasFiltros
} from 'src/app/@theme/services/Cuentas.service';

@Component({
  selector: 'app-cuentas-cobrar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cuentas-cobrar-component.html',
  styleUrls: ['./cuentas-cobrar-component.scss'],
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatFormFieldModule, MatInputModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatSelectModule, MatTooltipModule,
    MatDividerModule, MatChipsModule,
  ]
})
export class CuentasCobrarComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = [
    'nombre', 'tipo_cliente', 'telefono',
    'total_ventas', 'total_pagado', 'saldo_pendiente',
    'num_facturas', 'dias_mora', 'ultima_compra', 'acciones'
  ];

  cuentas: Cuenta[] = [];

  // ── Paginación ────────────────────────────────────────
  currentPage = 1;
  perPage     = 10;
  totalItems  = 0;
  lastPage    = 1;
  pages:      number[] = [];

  // ── Filtros ───────────────────────────────────────────
  busqueda      = '';
  filtroTipo    = '';   // '' | 'registrado' | 'ocasional'
  filtroMora    = '';   // '' | 'baja' | 'media' | 'alta'

  tiposCliente = [
    { value: '',             label: 'Todos los tipos'  },
    { value: 'registrado',   label: 'Registrado'       },
    { value: 'ocasional',    label: 'Ocasional'        },
  ];

  nivelMora = [
    { value: '',      label: 'Todos'           },
    { value: 'baja',  label: '≤ 7 días'        },
    { value: 'media', label: '8 – 30 días'     },
    { value: 'alta',  label: '> 30 días'       },
  ];

  // ── Estadísticas ──────────────────────────────────────
  totalDeuda = 0;

  // ── UI ────────────────────────────────────────────────
  cargando       = true;
  cargandoModal  = false;
  cargandoHistorial = false;

  // ── Modal historial ───────────────────────────────────
  @ViewChild('modalHistorial') modalHistorial!: TemplateRef<any>;
  dialogRefHistorial!: MatDialogRef<any>;
  cuentaSeleccionada: Cuenta | null = null;
  historialCliente:   HistorialCliente[] = [];

  private destroy$ = new Subject<void>();
  private search$  = new Subject<string>();

  constructor(
    private cuentaService: CuentaService,
    private router:        Router,
    private snackBar:      MatSnackBar,
    private dialog:        MatDialog,
    private cdr:           ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCuentas();

    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.cargarCuentas();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────
  cargarCuentas(): void {
    this.cargando = true;

    const filtros: CuentasFiltros = {
      page:     this.currentPage,
      per_page: this.perPage,
    };
    if (this.busqueda)   filtros.buscar       = this.busqueda;
    if (this.filtroTipo) filtros.tipo_cliente = this.filtroTipo;
    if (this.filtroMora) filtros.mora         = this.filtroMora;

    this.cuentaService.listarCuentasPorCobrar(filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const res        = response?.data ?? response;
          this.cuentas     = res?.data       ?? [];
          this.totalItems  = res?.total      ?? 0;
          this.lastPage    = res?.last_page  ?? 1;
          this.currentPage = res?.page       ?? 1;
          this.totalDeuda  = res?.total_deuda ?? 0;
          this.buildPages();
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.mostrarMensaje('Error al cargar las cuentas por cobrar', 'error');
          this.cargando = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Paginación ────────────────────────────────────────
  buildPages(): void {
    const delta = 2;
    const start = Math.max(1, this.currentPage - delta);
    const end   = Math.min(this.lastPage, this.currentPage + delta);
    this.pages  = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) return;
    this.currentPage = page;
    this.cargarCuentas();
  }

  onPerPageChange(): void {
    this.currentPage = 1;
    this.cargarCuentas();
  }

  // ── Filtros ───────────────────────────────────────────
  onSearch(): void {
    this.search$.next(this.busqueda);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.cargarCuentas();
  }

  clearFilters(): void {
    this.busqueda   = '';
    this.filtroTipo = '';
    this.filtroMora = '';
    this.currentPage = 1;
    this.cargarCuentas();
  }

  get hasActiveFilters(): boolean {
    return !!(this.busqueda || this.filtroTipo || this.filtroMora);
  }

  // ── Registrar pago ────────────────────────────────────
  registrarPago(cuenta: Cuenta): void {
    if (!cuenta.cliente_id) {
      this.mostrarMensaje('No se puede registrar pago para clientes ocasionales sin ID', 'warning');
      return;
    }
    if (cuenta.num_facturas === 1) {
      this.registrarPagoDirecto(cuenta);
    } else {
      this.mostrarMensaje(
        `${cuenta.nombre} tiene ${cuenta.num_facturas} facturas pendientes. Seleccione a cuál abonar.`,
        'warning'
      );
      this.verHistorial(cuenta);
    }
  }

  private registrarPagoDirecto(cuenta: Cuenta): void {
    this.cargandoModal = true;
    this.cuentaSeleccionada = cuenta;

    this.cuentaService.obtenerHistorialCliente(cuenta.cliente_id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const historial: HistorialCliente[] = response?.data ?? response ?? [];
          const ventaPendiente = historial.find(v => v.saldo_pendiente > 0);

          if (!ventaPendiente) {
            this.mostrarMensaje('No hay ventas pendientes para este cliente', 'warning');
            this.cargandoModal = false;
            this.cuentaSeleccionada = null;
            this.cdr.markForCheck();
            return;
          }

          this.router.navigate(['/component/registrar-pago'], {
            queryParams: {
              venta_id:       ventaPendiente.venta_id,
              cliente_nombre: ventaPendiente.cliente_nombre,
              saldo:          ventaPendiente.saldo_pendiente
            }
          });
          this.cargandoModal = false;
          this.cuentaSeleccionada = null;
          this.cdr.markForCheck();
        },
        error: () => {
          this.mostrarMensaje('Error al obtener la venta del cliente', 'error');
          this.cargandoModal = false;
          this.cuentaSeleccionada = null;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Modal historial ───────────────────────────────────
  verHistorial(cuenta: Cuenta): void {
    if (!cuenta.cliente_id) {
      this.mostrarMensaje('Solo se puede ver historial de clientes registrados', 'warning');
      return;
    }

    this.cuentaSeleccionada   = cuenta;
    this.cargandoHistorial    = true;
    this.historialCliente     = [];

    this.dialogRefHistorial = this.dialog.open(this.modalHistorial, {
      width: '900px', maxWidth: '95vw', maxHeight: '90vh', disableClose: false
    });

    this.cuentaService.obtenerHistorialCliente(cuenta.cliente_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.historialCliente  = response?.data ?? response ?? [];
          this.cargandoHistorial = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.mostrarMensaje('Error al cargar el historial del cliente', 'error');
          this.cargandoHistorial = false;
          this.cdr.markForCheck();
        }
      });
  }

  registrarPagoDesdeHistorial(venta: HistorialCliente): void {
    if (venta.saldo_pendiente <= 0) {
      this.mostrarMensaje('Esta venta ya está completamente pagada', 'warning');
      return;
    }
    this.cerrarModalHistorial();
    this.router.navigate(['/component/registrar-pago'], {
      queryParams: {
        venta_id:       venta.venta_id,
        cliente_nombre: venta.cliente_nombre,
        saldo:          venta.saldo_pendiente
      }
    });
  }

  cerrarModalHistorial(): void {
    this.dialogRefHistorial?.close();
    this.historialCliente   = [];
    this.cuentaSeleccionada = null;
  }

  // ── Helpers ───────────────────────────────────────────
  getMoraColor(dias: number): string {
    if (dias <= 7)  return 'mora-baja';
    if (dias <= 30) return 'mora-media';
    return 'mora-alta';
  }

  getTipoClienteBadge(tipo: string): string {
    return tipo === 'registrado' ? 'badge-registrado' : 'badge-ocasional';
  }

  formatDate(dateStr: string | Date): string {
    if (!dateStr) return '—';
    const d = new Date(String(dateStr).replace(' ', 'T').split('.')[0]);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota', day: '2-digit', month: 'short', year: 'numeric'
    });
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