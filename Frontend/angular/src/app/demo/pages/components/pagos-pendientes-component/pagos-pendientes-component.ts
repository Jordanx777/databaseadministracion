import {
  Component,
  AfterViewInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ===== ANGULAR MATERIAL ===== */
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/* ===== INTERFACE ===== */
export interface PagoPendiente {
  deudor: string;
  productos: string;
  cantidad: number;
  total: number;
  abono: number;
  saldo: number;
  estado: 'Pendiente' | 'Parcial' | 'Pagado';
}

@Component({
  selector: 'app-pagos-pendientes-component',
  standalone: true,
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
    MatButtonModule
  ],
  templateUrl: './pagos-pendientes-component.html',
  styleUrl: './pagos-pendientes-component.scss',
})
export class PagosPendientesComponent implements AfterViewInit {

  /* ===== COLUMNAS ===== */
  displayedColumns: string[] = [
    'deudor',
    'productos',
    'cantidad',
    'total',
    'abono',
    'saldo',
    'estado',
    'acciones'
  ];

  /* ===== DATA ===== */
  dataSource = new MatTableDataSource<PagoPendiente>([
    {
      deudor: 'Juan Pérez',
      productos: '2 Camisetas, 1 Pantalón',
      cantidad: 3,
      total: 180000,
      abono: 80000,
      saldo: 100000,
      estado: 'Parcial'
    },
    {
      deudor: 'María López',
      productos: '1 Gorra',
      cantidad: 1,
      total: 40000,
      abono: 0,
      saldo: 40000,
      estado: 'Pendiente'
    },
    {
      deudor: 'Carlos Díaz',
      productos: '2 Jeans',
      cantidad: 2,
      total: 160000,
      abono: 160000,
      saldo: 0,
      estado: 'Pagado'
    }
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.configurarFiltro();
  }

  /* ===== BUSCADOR ===== */
  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  configurarFiltro(): void {
    this.dataSource.filterPredicate = (data: PagoPendiente, filter: string) => {
      const texto = `
        ${data.deudor}
        ${data.productos}
        ${data.estado}
      `.toLowerCase();

      return texto.includes(filter);
    };
  }

  /* ===== ACCIONES ===== */
  editar(pago: PagoPendiente): void {
    console.log('Editar pago:', pago);
    // aquí luego abres un modal
  }

}
