import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

/* Angular Material */
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ventas-diarias-component',
  standalone: true,
  imports: [
    CommonModule,

    /* Material */
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ventas-diarias-component.html',
  styleUrl: './ventas-diarias-component.scss',
})
export class VentasDiariasComponent implements OnInit {

  /** COLUMNAS */
  displayedColumns: string[] = [
    'producto',
    'cliente',
    'cantidad',
    'precio',
    'total',
    'metodo',
    'fecha',
    'acciones'
  ];

  /** TABLA */
  dataSource = new MatTableDataSource<any>([]);

  /** ESTADOS */
  cargando = true;
  totalDia = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarVentasDelDia();
  }

  /** CARGAR VENTAS (MOCK) */
  cargarVentasDelDia(): void {
    this.cargando = true;

    setTimeout(() => {
      const ventas = [
        {
          producto: 'Camiseta Oversize',
          cliente: 'Juan Pérez',
          cantidad: 2,
          precio: 45000,
          total: 90000,
          metodo: 'Efectivo',
          fecha: new Date()
        },
        {
          producto: 'Pantalón Cargo',
          cliente: 'Cliente ocasional',
          cantidad: 1,
          precio: 120000,
          total: 120000,
          metodo: 'Nequi',
          fecha: new Date()
        }
      ];

      this.dataSource.data = ventas;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      this.calcularTotalDia();

      this.cargando = false;
      this.cdr.detectChanges();
    }, 700);
  }

  /** FILTRO */
  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  /** TOTAL DEL DÍA */
  calcularTotalDia(): void {
    this.totalDia = this.dataSource.data.reduce(
      (acc, venta) => acc + venta.total,
      0
    );
  }

  /** ACCIONES */
  agregarVenta(): void {
    console.log('Ir a agregar venta');
  }

  editarVenta(row: any): void {
    console.log('Editar venta:', row);
  }

  eliminarVenta(row: any): void {
    console.log('Eliminar venta:', row);
  }
}
