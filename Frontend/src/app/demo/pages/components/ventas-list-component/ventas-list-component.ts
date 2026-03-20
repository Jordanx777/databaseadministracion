import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy
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
import { MatSelectModule }          from '@angular/material/select';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatChipsModule }           from '@angular/material/chips';
import { MatMenuModule }            from '@angular/material/menu';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule }      from '@angular/material/core';

import { VentasService, VentaCompleta } from 'src/app/@theme/services/Ventas.services';

@Component({
  selector: 'app-ventas-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ventas-list-component.html',
  styleUrls: ['./ventas-list-component.scss'],
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatFormFieldModule, MatInputModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatSelectModule, MatTooltipModule, MatChipsModule,
    MatMenuModule, MatDatepickerModule, MatNativeDateModule,
  ]
})
export class VentasListComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = [
    'numero_factura', 'fecha_venta', 'cliente', 'tipo_cliente',
    'venta_total', 'total_pagado', 'saldo_pendiente',
    'tipo_pago', 'estado', 'acciones'
  ];

  ventas: VentaCompleta[] = [];

  // ── Paginación ────────────────────────────────────────
  currentPage = 1;
  perPage     = 10;
  totalItems  = 0;
  lastPage    = 1;
  pages:      number[] = [];

  // ── Filtros ───────────────────────────────────────────
  busqueda         = '';
  filtroEstado     = '';
  filtroTipoPago   = '';
  filtroFechaDesde: Date | null = null;
  filtroFechaHasta: Date | null = null;

  estados = [
    { value: '',          label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendientes'        },
    { value: 'pagada',    label: 'Pagadas'           },
    { value: 'cancelada', label: 'Canceladas'        },
  ];

  tiposPago = [
    { value: '',        label: 'Todos los tipos' },
    { value: 'contado', label: 'Contado'         },
    { value: 'credito', label: 'Crédito'         },
    { value: 'mixto',   label: 'Mixto'           },
  ];

  // ── Estadísticas ──────────────────────────────────────
  totalVendido   = 0;
  totalPorCobrar = 0;

  cargando = true;

  private destroy$ = new Subject<void>();
  private search$  = new Subject<string>();

  constructor(
    private ventasService: VentasService,
    private router:        Router,
    private snackBar:      MatSnackBar,
    private cdr:           ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarVentas();

    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.cargarVentas();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────
  cargarVentas(): void {
    this.cargando = true;

    const filtros: any = {
      page:     this.currentPage,
      per_page: this.perPage,
    };

    if (this.busqueda)       filtros.buscar    = this.busqueda;
    if (this.filtroEstado)   filtros.estado    = this.filtroEstado;
    if (this.filtroTipoPago) filtros.tipo_pago = this.filtroTipoPago;

    // Convertir Date a string YYYY-MM-DD para el backend
    if (this.filtroFechaDesde instanceof Date) {
      filtros.fecha_desde = this.filtroFechaDesde.toISOString().split('T')[0];
    }
    if (this.filtroFechaHasta instanceof Date) {
      filtros.fecha_hasta = this.filtroFechaHasta.toISOString().split('T')[0];
    }

    this.ventasService.obtenerVentasCompletas(filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const res           = response?.data ?? response;
          this.ventas         = res?.data             ?? [];
          this.totalItems     = res?.total            ?? 0;
          this.lastPage       = res?.last_page        ?? 1;
          this.currentPage    = res?.page             ?? 1;
          this.totalVendido   = res?.total_vendido    ?? 0;
          this.totalPorCobrar = res?.total_por_cobrar ?? 0;
          this.buildPages();
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error:', err);
          this.mostrarMensaje('Error al cargar las ventas', 'error');
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
    this.cargarVentas();
  }

  onPerPageChange(): void {
    this.currentPage = 1;
    this.cargarVentas();
  }

  // ── Filtros ───────────────────────────────────────────
  onSearch(): void {
    this.search$.next(this.busqueda);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.cargarVentas();
  }

  clearFilters(): void {
    this.busqueda         = '';
    this.filtroEstado     = '';
    this.filtroTipoPago   = '';
    this.filtroFechaDesde = null;
    this.filtroFechaHasta = null;
    this.currentPage      = 1;
    this.cargarVentas();
  }

  get hasActiveFilters(): boolean {
    return !!(this.busqueda || this.filtroEstado || this.filtroTipoPago ||
              this.filtroFechaDesde || this.filtroFechaHasta);
  }

  // ── Navegación ────────────────────────────────────────
  agregarVenta(): void {
    this.router.navigate(['/component/addventas']);
  }

  verDetalle(v: VentaCompleta): void {
    this.router.navigate(['/component/cuentas-detalles', v.venta_id]);
  }

  registrarPago(v: VentaCompleta): void {
    this.router.navigate(['/component/registrar-pago'], {
      queryParams: {
        venta_id:       v.venta_id,
        cliente_nombre: v.cliente_nombre,
        saldo:          v.saldo_pendiente
      }
    });
  }

  verCuentaCliente(v: VentaCompleta): void {
    if (v.cliente_id) {
      this.router.navigate(['/component/cuentas', v.cliente_id]);
    } else {
      this.mostrarMensaje('Este es un cliente ocasional sin cuenta', 'warning');
    }
  }

  // ── Helpers ───────────────────────────────────────────
  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      pagada:    'chip-pagada',
      pendiente: 'chip-pendiente',
      cancelada: 'chip-cancelada',
    };
    return map[estado] ?? '';
  }

  getTipoPagoClass(tipo: string): string {
    const map: Record<string, string> = {
      contado: 'tipo-contado',
      credito: 'tipo-credito',
      mixto:   'tipo-mixto',
    };
    return map[tipo] ?? '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr.replace(' ', 'T').split('.')[0]);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
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