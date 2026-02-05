import {
  Component,
  AfterViewInit,
  ViewChild,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

/* ===== ANGULAR MATERIAL ===== */
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

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
    ReactiveFormsModule,

    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule
  ]
})
export class ProductosComponent implements AfterViewInit {

  /* ===== MODAL ===== */
  @ViewChild('modalProducto') modalProducto!: TemplateRef<any>;
  dialogRef!: MatDialogRef<any>;

  /* ===== FORM ===== */
  formProducto!: FormGroup;
  modoFormulario: 'agregar' | 'editar' = 'agregar';
  productoEditando: Producto | null = null;

  /* ===== SELECT DATA ===== */
  categorias = ['Ropa', 'Accesorios'];
  tallas = ['XS', 'S', 'M', 'L', 'XL'];
  proveedores = ['Proveedor A', 'Proveedor B'];

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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.crearFormulario();
    this.configurarFiltro();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /* ===== FORM ===== */
  crearFormulario(): void {
    this.formProducto = this.fb.group({
      nombre: ['', Validators.required],
      categoria_nombre: ['', Validators.required],
      talla: ['', Validators.required],
      color: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      proveedor_nombre: ['', Validators.required]
    });
  }

  /* ===== FILTRO GLOBAL ===== */
  configurarFiltro(): void {
    this.dataSource.filterPredicate = (data: Producto, filter: string) => {
      const texto = `
        ${data.nombre}
        ${data.categoria_nombre}
        ${data.talla}
        ${data.color}
        ${data.proveedor_nombre}
      `.toLowerCase();

      return texto.includes(filter);
    };
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  /* ===== MODAL ===== */
  agregarProducto(): void {
    this.modoFormulario = 'agregar';
    this.productoEditando = null;
    this.formProducto.reset({
      nombre: '',
      categoria_nombre: '',
      talla: '',
      color: '',
      cantidad: 0,
      precioCompra: 0,
      precioVenta: 0,
      proveedor_nombre: ''
    });

    this.abrirModal();
  }

  editarProducto(producto: Producto): void {
    this.modoFormulario = 'editar';
    this.productoEditando = producto;
    this.formProducto.patchValue(producto);

    this.abrirModal();
  }

  abrirModal(): void {
    this.dialogRef = this.dialog.open(this.modalProducto, {
      width: '750px',
      disableClose: true
    });
  }

  cerrarModal(): void {
    this.dialogRef.close();
  }

  /* ===== GUARDAR ===== */
  guardar(): void {
    if (this.formProducto.invalid) {
      this.formProducto.markAllAsTouched();
      return;
    }

    if (this.modoFormulario === 'agregar') {
      this.dataSource.data = [
        ...this.dataSource.data,
        this.formProducto.value
      ];
    } else if (this.productoEditando) {
      Object.assign(this.productoEditando, this.formProducto.value);
      this.dataSource.data = [...this.dataSource.data];
    }

    this.cerrarModal();
  }

  eliminarProducto(producto: Producto): void {
    this.dataSource.data = this.dataSource.data.filter(p => p !== producto);
  }
}
