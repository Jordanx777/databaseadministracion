// src/app/modules/ventas/components/ventas-list/ventas-list.component.ts

import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';

import { VentasService, VentaCompleta } from 'src/app/@theme/services/Ventas.services';

@Component({
  selector: 'app-ventas-list',
  standalone: true,
  templateUrl: './ventas-list-component.html',
  styleUrls: ['./ventas-list-component.scss'],
  imports: [
    CommonModule,
    FormsModule,
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
    MatSelectModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
  ]
})
export class VentasListComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'numero_factura',
    'fecha_venta',
    'cliente',
    'tipo_cliente',
    'venta_total',
    'total_pagado',
    'saldo_pendiente',
    'tipo_pago',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<VentaCompleta>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Filtros
  filtroEstado = '';
  filtroTipoPago = '';

  estados = [
    { value: '', label: 'Todos' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'pagada', label: 'Pagadas' },
  ];

  tiposPago = [
    { value: '', label: 'Todos' },
    { value: 'contado', label: 'Contado' },
    { value: 'credito', label: 'Crédito' },
    { value: 'mixto', label: 'Mixto' },
  ];

  cargando = true;

  // Estadísticas
  totalVentas = 0;
  totalPorCobrar = 0;

  constructor(
    private ventasService: VentasService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.configurarFiltro();
  }

  ngOnInit(): void {
    this.cargarVentas();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cargarVentas(): void {
    this.cargando = true;
    
    const filtros: any = {};
    if (this.filtroEstado) filtros.estado = this.filtroEstado;
    if (this.filtroTipoPago) filtros.tipo_pago = this.filtroTipoPago;

    this.ventasService.obtenerVentasCompletas(filtros).subscribe({
      next: (response) => {
        const ventas = response.data || [];
        this.dataSource.data = ventas;
        this.calcularEstadisticas(ventas);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al cargar las ventas', 'error');
        this.cargando = false;
      }
    });
  }

  calcularEstadisticas(ventas: VentaCompleta[]): void {
    this.totalVentas = ventas.reduce((sum, v) => sum + Number(v.venta_total), 0);
    this.totalPorCobrar = ventas.reduce((sum, v) => sum + Number(v.saldo_pendiente), 0);
  }

  configurarFiltro(): void {
    this.dataSource.filterPredicate = (data: VentaCompleta, filter: string) => {
      const texto = `
        ${data.numero_factura}
        ${data.cliente_nombre}
        ${data.cliente_apodo || ''}
      `.toLowerCase();
      return texto.includes(filter);
    };
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.paginator) this.paginator.firstPage();
  }

  aplicarFiltros(): void {
    this.cargarVentas();
  }

  verDetalle(venta: VentaCompleta): void {
    this.router.navigate(['/component/cuentas-detalles', venta.venta_id]);
  }
  // hago la ruta para usar this.router y enviar al component de agregar ventas 
  agregarVenta(): void {
    this.router.navigate(['/component/addventas']);
  }

  registrarPago(venta: VentaCompleta): void {
    // Redirigir a formulario de pago
    this.router.navigate(['/component/pagos/registrar'], {
      queryParams: {
        venta_id: venta.venta_id,
        cliente_nombre: venta.cliente_nombre,
        saldo: venta.saldo_pendiente
      }
    });
  }

  verCuentaCliente(venta: VentaCompleta): void {
    if (venta.cliente_id) {
      this.router.navigate(['/component/cuentas', venta.cliente_id]);
    } else {
      this.mostrarMensaje('Este es un cliente ocasional sin cuenta', 'warning');
    }
  }

  getEstadoColor(estado: string): string {
    return estado === 'pagada' ? 'estado-pagada' : 'estado-pendiente';
  }

  getTipoPagoColor(tipo: string): string {
    switch(tipo) {
      case 'contado': return 'tipo-contado';
      case 'credito': return 'tipo-credito';
      case 'mixto': return 'tipo-mixto';
      default: return '';
    }
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