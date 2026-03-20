// src/app/demo/pages/estadisticas/estadisticas.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/* Angular Material */
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

/* Chart.js */
import { Chart, registerables, TooltipItem, ChartTypeRegistry } from 'chart.js';
Chart.register(...registerables);

/* Servicios */
import { DashboardService, DashboardCompleto } from 'src/app/@theme/services/Dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  cargando = true;
  dashboard: DashboardCompleto | null = null;

  // Charts
  chartVentasDiarias: Chart | null = null;
  chartVentasMensuales: Chart | null = null;
  chartVentasPorCategoria: Chart | null = null;
  chartVentasPorGenero: Chart | null = null;
  chartStockPorCategoria: Chart | null = null;

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.cargando = true;

    this.dashboardService.getDashboardCompleto().subscribe({
      next: (response: any) => {
        
        this.dashboard = this.extraerDatos(response);

        if (this.dashboard) {
          setTimeout(() => {
            this.crearGraficos();
          }, 100);
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar dashboard:', error);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extraerDatos(response: any): DashboardCompleto | null {
    if (response?.data) return response.data;
    if (response?.success && response?.data) return response.data;
    return response;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GRÁFICOS
  // ═══════════════════════════════════════════════════════════════════════════

  crearGraficos(): void {
    this.crearGraficoVentasDiarias();
    this.crearGraficoVentasMensuales();
    this.crearGraficoVentasPorCategoria();
    this.crearGraficoVentasPorGenero();
    this.crearGraficoStockPorCategoria();
  }

  private crearGraficoVentasDiarias(): void {
    const canvas = document.getElementById('chartVentasDiarias') as HTMLCanvasElement;
    if (!canvas || !this.dashboard?.ventas_ultimos_7_dias) return;

    const datos = this.dashboard.ventas_ultimos_7_dias;

    this.chartVentasDiarias = new Chart(canvas, {
      type: 'line',
      data: {
        labels: datos.map(d => this.formatearFecha(d.fecha)),
        datasets: [{
          label: 'Ventas (COP)',
          data: datos.map(d => parseFloat(String(d.total_ventas))),
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'line'>) => {
                const value = context.parsed?.y ?? 0;
                return `$${value.toLocaleString('es-CO')}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: string | number) => `$${Number(value).toLocaleString('es-CO')}`
            }
          }
        }
      }
    });
  }

  private crearGraficoVentasMensuales(): void {
    const canvas = document.getElementById('chartVentasMensuales') as HTMLCanvasElement;
    if (!canvas || !this.dashboard?.ventas_mensuales) return;

    const datos = this.dashboard.ventas_mensuales;

    this.chartVentasMensuales = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.mes.trim()),
        datasets: [{
          label: 'Ventas Mensuales (COP)',
          data: datos.map(d => parseFloat(String(d.total_ventas))),
          backgroundColor: '#ff9800',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'bar'>) => {
                const value = context.parsed?.y ?? 0;
                return `$${value.toLocaleString('es-CO')}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: string | number) => `$${Number(value).toLocaleString('es-CO')}`
            }
          }
        }
      }
    });
  }

  private crearGraficoVentasPorCategoria(): void {
    const canvas = document.getElementById('chartVentasPorCategoria') as HTMLCanvasElement;
    if (!canvas || !this.dashboard?.ventas_por_categoria) return;

    const datos = this.dashboard.ventas_por_categoria;

    this.chartVentasPorCategoria = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: datos.map(d => d.categoria),
        datasets: [{
          data: datos.map(d => parseFloat(String(d.total_vendido))),
          backgroundColor: [
            '#3f51b5',
            '#ff9800',
            '#4caf50',
            '#f44336',
            '#9c27b0',
            '#00bcd4'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'doughnut'>) => {
                const label = context.label || '';
                const value = typeof context.parsed === 'number' ? context.parsed : 0;
                return `${label}: $${value.toLocaleString('es-CO')}`;
              }
            }
          }
        }
      }
    });
  }

  private crearGraficoVentasPorGenero(): void {
    const canvas = document.getElementById('chartVentasPorGenero') as HTMLCanvasElement;
    if (!canvas || !this.dashboard?.ventas_por_genero) return;

    const datos = this.dashboard.ventas_por_genero;

    this.chartVentasPorGenero = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: datos.map(d => d.genero),
        datasets: [{
          data: datos.map(d => parseFloat(String(d.total_vendido))),
          backgroundColor: [
            '#2196f3',
            '#e91e63',
            '#4caf50',
            '#ff9800',
            '#9c27b0'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'pie'>) => {
                const label = context.label || '';
                const value = typeof context.parsed === 'number' ? context.parsed : 0;
                return `${label}: $${value.toLocaleString('es-CO')}`;
              }
            }
          }
        }
      }
    });
  }

  private crearGraficoStockPorCategoria(): void {
    const canvas = document.getElementById('chartStockPorCategoria') as HTMLCanvasElement;
    if (!canvas || !this.dashboard?.stock_por_categoria) return;

    const datos = this.dashboard.stock_por_categoria;

    this.chartStockPorCategoria = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: datos.map(d => d.categoria),
        datasets: [{
          label: 'Stock Total',
          data: datos.map(d => parseFloat(String(d.stock_total))),
          backgroundColor: '#4caf50',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  }

  formatearMoneda(valor: number | string): string {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numero);
  }

  verProducto(id: number): void {
    this.router.navigate(['/component/producto', id]);
  }

  verCliente(id: number): void {
    this.router.navigate(['/component/cuentas', id]);
  }

  ngOnDestroy(): void {
    this.chartVentasDiarias?.destroy();
    this.chartVentasMensuales?.destroy();
    this.chartVentasPorCategoria?.destroy();
    this.chartVentasPorGenero?.destroy();
    this.chartStockPorCategoria?.destroy();
  }
}