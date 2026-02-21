// components/cuenta-detail/cuenta-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CuentaService,HistorialCliente} from 'src/app/@theme/services/Cuentas.service';

import { ComponentFixture, TestBed } from '@angular/core/testing';

@Component({
  selector: 'app-cuenta-detail',
  templateUrl: './cuenta-detail.component.html',
  styleUrls: ['./cuenta-detail.component.scss']
})
export class CuentaDetailComponent implements OnInit {
  clienteId: number;
  historial: HistorialCliente[] = [];
  loading = false;
  
  // Resumen
  clienteNombre = '';
  totalVentas = 0;
  totalPagado = 0;
  saldoPendiente = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cuentaService: CuentaService
  ) { }

  ngOnInit(): void {
    // this.clienteId = +this.route.snapshot.paramMap.get('id');
    this.clienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.loading = true;
    this.cuentaService.obtenerHistorialCliente(this.clienteId).subscribe({
      next: (data) => {
        this.historial = data;
        if (data.length > 0) {
          this.clienteNombre = data[0].cliente_nombre;
          this.calcularResumen();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.loading = false;
      }
    });
  }

  calcularResumen(): void {
    this.totalVentas = this.historial.reduce((sum, h) => sum + h.monto_venta, 0);
    this.totalPagado = this.historial.reduce((sum, h) => sum + h.total_pagado, 0);
    this.saldoPendiente = this.totalVentas - this.totalPagado;
  }

  registrarPago(ventaId: number): void {
    this.router.navigate(['/cuentas/registrar-pago'], {
      queryParams: { ventaId: ventaId }
    });
  }

  verFactura(numeroFactura: string): void {
    this.router.navigate(['/ventas/detalle', numeroFactura]);
  }
}