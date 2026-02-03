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
export interface Producto {
  nombre: string;
  categoria_nombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  proveedor_nombre: string;
}

@Component({
  selector: 'app-productos-component',
  standalone: true,
  templateUrl: './productos-component.html',
  styleUrls: ['./productos-component.scss'],
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
  ]
})
export class ProductosComponent implements AfterViewInit {

  /* ===== COLUMNAS ===== */
  displayedColumns: string[] = [
    'nombre',
    'categoria',
    'talla',
    'color',
    'cantidad',
    'precioCompra',
    'precioVenta',
    'proveedor',
    'acciones'
  ];

  /* ===== DATA SOURCE ===== */
  dataSource = new MatTableDataSource<Producto>([
    {
      nombre: 'Camiseta Oversize',
      categoria_nombre: 'Ropa',
      talla: 'M',
      color: 'Negro',
      cantidad: 12,
      precioCompra: 30000,
      precioVenta: 60000,
      proveedor_nombre: 'Proveedor A'
    },
    {
      nombre: 'Pantalón Cargo',
      categoria_nombre: 'Ropa',
      talla: 'L',
      color: 'Verde',
      cantidad: 4,
      precioCompra: 45000,
      precioVenta: 90000,
      proveedor_nombre: 'Proveedor B'
    }
  ]);

  /* ===== VIEWCHILD ===== */
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  /* ===== INIT ===== */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /* ===== FILTRO ===== */
  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  /* ===== CRUD ===== */
  agregarProducto(): void {
    console.log('Agregar producto');
  }

  editarProducto(producto: Producto): void {
    console.log('Editar', producto);
  }

  eliminarProducto(producto: Producto): void {
    this.dataSource.data = this.dataSource.data.filter(p => p !== producto);
  }
}
