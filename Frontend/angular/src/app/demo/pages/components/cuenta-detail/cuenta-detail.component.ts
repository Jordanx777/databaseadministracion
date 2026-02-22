// src/app/modules/ventas/components/venta-detail/venta-detail.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

/* Angular Material */
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { VentasService, VentaCompleta } from 'src/app/@theme/services/Ventas.services';

@Component({
  selector: 'app-cuenta-detail',
  standalone: true,
  templateUrl: './cuenta-detail.component.html',
  styleUrl: './cuenta-detail.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
  ]
})
export class CuentaDetailComponent implements OnInit {

  venta: VentaCompleta | null = null;
  ventaId: number = 0;
  cargando = true;

  // Columnas para tabla de productos
  columnasProductos = ['producto', 'variante', 'cantidad', 'precio_unitario', 'subtotal'];

  // Columnas para tabla de pagos
  columnasPagos = ['fecha', 'monto', 'metodo', 'referencia'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ventasService: VentasService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener ID de la ruta
    this.ventaId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (this.ventaId) {
      this.cargarVenta();
    } else {
      this.mostrarMensaje('ID de venta inválido', 'error');
      this.router.navigate(['/component/ventas']);
    }
  }

  cargarVenta(): void {
    this.cargando = true;
    
    this.ventasService.obtenerVentaCompletaPorId(this.ventaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.venta = response.data;
          this.cargando = false;
          this.cdr.detectChanges();
        } else {
          this.mostrarMensaje('Venta no encontrada', 'error');
          this.router.navigate(['/component/ventas']);
        }
      },
      error: (error) => {
        console.error('Error al cargar venta:', error);
        this.mostrarMensaje('Error al cargar los detalles de la venta', 'error');
        this.cargando = false;
        this.router.navigate(['/component/ventas']);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/component/ventas']);
  }

  registrarPago(): void {
    if (!this.venta) return;
    
    this.router.navigate(['/component/pagos/registrar'], {
      queryParams: {
        venta_id: this.venta.venta_id,
        cliente_nombre: this.venta.cliente_nombre,
        saldo: this.venta.saldo_pendiente
      }
    });
  }

  verCuentaCliente(): void {
    if (!this.venta || !this.venta.cliente_id) {
      this.mostrarMensaje('Este es un cliente ocasional sin cuenta', 'warning');
      return;
    }
    
    this.router.navigate(['/component/cuentas', this.venta.cliente_id]);
  }

  cancelarVenta(): void {
    if (!this.venta) return;

    if (confirm('¿Está seguro de cancelar esta venta? Se devolverá el stock al inventario.')) {
      this.ventasService.cancelar(this.venta.venta_id).subscribe({
        next: (response) => {
          this.mostrarMensaje('Venta cancelada exitosamente', 'success');
          this.router.navigate(['/component/ventas-diarias']);
        },
        error: (error) => {
          console.error('Error:', error);
          this.mostrarMensaje('Error al cancelar la venta', 'error');
        }
      });
    }
  }

  imprimirFactura(): void {
    window.print();
  }

  getEstadoClass(estado: string): string {
    switch(estado) {
      case 'pagada': return 'estado-pagada';
      case 'pendiente': return 'estado-pendiente';
      case 'cancelada': return 'estado-cancelada';
      default: return '';
    }
  }

  getTipoPagoClass(tipo: string): string {
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