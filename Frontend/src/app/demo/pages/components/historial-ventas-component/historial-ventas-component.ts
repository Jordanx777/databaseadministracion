// src/app/modules/ventas/components/historial-ventas/historial-ventas.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // ✅ Agregar

/* Angular Material */
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';

/* Servicios */
import { VentasService } from 'src/app/@theme/services/Ventas.services';

interface HistorialVenta {
  venta_id: number;
  numero_factura: string;
  fecha_venta: string;
  cliente_id: number | null;
  cliente_nombre: string;
  monto_venta: number;
  tipo_pago: string;
  estado_venta: string;
  total_pagado: number;
  saldo_pendiente: number;
  productos: any[];
  pagos: any[];
}

@Component({
  selector: 'app-historial-ventas',
  standalone: true,
  templateUrl: './historial-ventas-component.html',
  styleUrls: ['./historial-ventas-component.scss'],
  imports: [
    CommonModule,
    FormsModule, // ✅ Agregar
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatExpansionModule,
  ]
})
export class HistorialVentasComponent implements OnInit {

  historial: HistorialVenta[] = [];
  historialFiltrado: HistorialVenta[] = [];
  
  cargando = true;
  busqueda = '';
  filtroEstado = 'todas';
  filtroTipoPago = 'todos';

  // Paginación
  paginaActual = 0;
  itemsPorPagina = 10;
  totalItems = 0;

  // Estadísticas
  estadisticas = {
    total_ventas: 0,
    total_vendido: 0,
    total_cobrado: 0,
    total_pendiente: 0,
    num_ventas_pagadas: 0,
    num_ventas_pendientes: 0,
    num_ventas_canceladas: 0
  };

  constructor(
    private ventasService: VentasService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  // ─── CARGAR DATOS ──────────────────────────────────────────────────────────

  cargarHistorial(): void {
    this.cargando = true;
    
    this.ventasService.getHistorialCompleto().subscribe({
      next: (response: any) => {
        
        this.historial = this.extraerDatos(response);
        this.historialFiltrado = [...this.historial];
        this.totalItems = this.historial.length;
        
        this.calcularEstadisticas();
        this.aplicarFiltros();
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.mostrarMensaje('Error al cargar el historial de ventas', 'error');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extraerDatos(response: any): HistorialVenta[] {
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }

  // ─── FILTROS ───────────────────────────────────────────────────────────────

  aplicarFiltros(): void {
    let resultado = [...this.historial];

    // Filtro de búsqueda
    if (this.busqueda.trim()) {
      const termino = this.busqueda.toLowerCase();
      resultado = resultado.filter(v => 
        v.numero_factura.toLowerCase().includes(termino) ||
        v.cliente_nombre.toLowerCase().includes(termino) ||
        v.venta_id.toString().includes(termino)
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'todas') {
      resultado = resultado.filter(v => v.estado_venta === this.filtroEstado);
    }

    // Filtro por tipo de pago
    if (this.filtroTipoPago !== 'todos') {
      resultado = resultado.filter(v => v.tipo_pago === this.filtroTipoPago);
    }

    this.historialFiltrado = resultado;
    this.totalItems = resultado.length;
    this.paginaActual = 0;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = 'todas';
    this.filtroTipoPago = 'todos';
    this.aplicarFiltros();
  }

  // ─── ESTADÍSTICAS ──────────────────────────────────────────────────────────

  calcularEstadisticas(): void {
    // ✅ Filtrar solo ventas NO canceladas para los cálculos
    const ventasActivas = this.historial.filter(v => v.estado_venta !== 'cancelada');
    
    this.estadisticas = {
      total_ventas: this.historial.length,
      
      // ✅ Solo sumar ventas activas (no canceladas)
      total_vendido: ventasActivas.reduce((sum, v) => sum + Number(v.monto_venta), 0),
      total_cobrado: ventasActivas.reduce((sum, v) => sum + Number(v.total_pagado), 0),
      total_pendiente: ventasActivas.reduce((sum, v) => sum + Number(v.saldo_pendiente), 0),
      
      num_ventas_pagadas: this.historial.filter(v => v.estado_venta === 'pagada').length,
      num_ventas_pendientes: this.historial.filter(v => v.estado_venta === 'pendiente').length,
      num_ventas_canceladas: this.historial.filter(v => v.estado_venta === 'cancelada').length
    };
  }

  // ─── PAGINACIÓN ────────────────────────────────────────────────────────────

  get historialPaginado(): HistorialVenta[] {
    const inicio = this.paginaActual * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.historialFiltrado.slice(inicio, fin);
  }

  onPageChange(event: PageEvent): void {
    this.paginaActual = event.pageIndex;
    this.itemsPorPagina = event.pageSize;
  }

  // ─── NAVEGACIÓN ────────────────────────────────────────────────────────────

  verDetalleVenta(ventaId: number): void {
    this.router.navigate(['/component/cuentas-detalles', ventaId]);
  }

  verCuentaCliente(clienteId: number | null): void {
    if (clienteId) {
      this.router.navigate(['/component/cuentas', clienteId]);
    } else {
      this.mostrarMensaje('Cliente ocasional sin cuenta asociada', 'warning');
    }
  }

  registrarPago(venta: HistorialVenta): void {
    if (venta.saldo_pendiente > 0) {
      this.router.navigate(['/component/registrar-pago'], {
        queryParams: {
          venta_id: venta.venta_id,
          cliente_nombre: venta.cliente_nombre,
          saldo: venta.saldo_pendiente
        }
      });
    }
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  getEstadoClass(estado: string): string {
    const clases: any = {
      'pagada': 'estado-pagada',
      'pendiente': 'estado-pendiente',
      'cancelada': 'estado-cancelada'
    };
    return clases[estado] || '';
  }

  getTipoPagoClass(tipo: string): string {
    const clases: any = {
      'contado': 'tipo-contado',
      'credito': 'tipo-credito',
      'mixto': 'tipo-mixto'
    };
    return clases[tipo] || '';
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