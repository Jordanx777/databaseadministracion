
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

import { CuentaService, Cuenta, HistorialCliente } from 'src/app/@theme/services/Cuentas.service';

@Component({
  selector: 'app-cliente-cuenta',
  standalone: true,
  templateUrl: './cuentas-cliente-component.html',
  styleUrls: ['./cuentas-cliente-component.scss'],
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
  ]
})
export class CuentasClienteComponent implements OnInit {

  clienteId: number = 0;
  historial: HistorialCliente[] = [];
  resumenCuenta: Cuenta | null = null;
  cargando = true;

  // Resumen calculado
  totalVentas = 0;
  totalPagado = 0;
  saldoPendiente = 0;
  numFacturas = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cuentaService: CuentaService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.clienteId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (this.clienteId) {
      this.cargarDatosCliente();
    } else {
      this.mostrarMensaje('ID de cliente inválido', 'error');
      this.router.navigate(['/component/ventas']);
    }
  }

  cargarDatosCliente(): void {
    this.cargando = true;

    // Cargar resumen de cuenta (cuentas_por_cobrar)
    this.cuentaService.obtenerDeudaClienteRegistrado(this.clienteId).subscribe({
      next: (response: any) => {
        this.resumenCuenta = response.data || response;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar resumen:', error);
      }
    });

    // Cargar historial completo activo (historial_cliente_activas)
    this.cuentaService.obtenerHistorialClienteActivos(this.clienteId).subscribe({
      next: (response: any) => {
        this.historial = Array.isArray(response?.data) ? response.data : [];
        
        if (this.historial.length > 0) {
          this.calcularResumen();
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.mostrarMensaje('Error al cargar el historial del cliente', 'error');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularResumen(): void {
    this.totalVentas = this.historial.reduce((sum, h) => sum + Number(h.monto_venta), 0);
    this.totalPagado = this.historial.reduce((sum, h) => sum + Number(h.total_pagado), 0);
    this.saldoPendiente = this.totalVentas - this.totalPagado;
    this.numFacturas = this.historial.length;
  }

  volver(): void {
    this.router.navigate(['/component/ventas']);
  }

  registrarPago(ventaId: number): void {
    this.router.navigate(['/component/registrar-pago'], {
      queryParams: { venta_id: ventaId }
    });
  }

  verDetalleVenta(ventaId: number): void {
    this.router.navigate(['/component/cuentas-detalles', ventaId]);
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