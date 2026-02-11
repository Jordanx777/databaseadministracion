import {
  Component,
  AfterViewInit,
  ViewChild,
  OnInit,
   ChangeDetectorRef // ✅ Agregar esto
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/* ===== ANGULAR MATERIAL ===== */
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

/* ===== SERVICIOS ===== */
import { ProductosService, Producto } from 'src/app/@theme/services/Productos.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-productos-component',
  standalone: true,
  templateUrl: './productos-component.html',
  styleUrls: ['./productos-component.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class ProductosComponent implements OnInit, AfterViewInit {

  /* ===== COLUMNAS ===== */
  displayedColumns: string[] = [
    'imagen',
    'nombre',
    'categoria',
    'talla',
    'color',
    'stock',
    'precio_compra',
    'precio_venta',
    'proveedor',
    'acciones'
  ];

  /* ===== DATA SOURCE ===== */
  dataSource = new MatTableDataSource<Producto>([]);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  /* ===== LOADING ===== */
  cargando = true;

  /* ===== URL DE IMÁGENES ===== */
  baseUrlImagenes = environment.imagesUrl;

  constructor(
    private productosService: ProductosService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef // ✅ Inyectar ChangeDetectorRef
  ) {
    this.configurarFiltro();
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /* ===== CARGAR PRODUCTOS ===== */
  cargarProductos(): void {
    this.cargando = true;
    this.productosService.getProductos().subscribe({
      next: (response) => {
        console.log('Respuesta completa:', response);
        const productos = this.extraerDatos(response);
        console.log('Productos extraídos:', productos);
        
        this.dataSource.data = productos;
        
        // ✅ Usar setTimeout y detectChanges
        setTimeout(() => {
          this.cargando = false;
          this.cdr.detectChanges();
          console.log('Estado cargando:', this.cargando);
        }, 100);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.mostrarMensaje('Error al cargar los productos', 'error');
        
        // ✅ También aquí
        setTimeout(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }, 100);
      }
    });
  }

  /* ===== EXTRAER DATOS ===== */
  private extraerDatos(response: any): any[] {
    if (response?.data) return Array.isArray(response.data) ? response.data : [];
    if (Array.isArray(response)) return response;
    return [];
  }

  /* ===== OBTENER URL DE IMAGEN ===== */
  getImagenUrl(producto: Producto): string {
    if (producto.imagen_url) {
      return this.baseUrlImagenes + producto.imagen_url;
    }
    return 'assets/images/no-image.png';
  }

  /* ===== FILTRO GLOBAL ===== */
  configurarFiltro(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const texto = `
        ${data.nombre || ''}
        ${data.categoria_nombre || ''}
        ${data.talla || ''}
        ${data.color || ''}
        ${data.marca_nombre || ''}
        ${data.proveedor_nombre || ''}
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

  /* ===== ACCIONES ===== */
  agregarProducto(): void {
    this.router.navigate(['component/addproducto']);
  }

  editarProducto(producto: Producto): void {
    this.router.navigate(['component/addproducto', producto.id]);
  }

  eliminarProducto(producto: Producto): void {
    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) {
      this.productosService.eliminarProducto(producto.id!).subscribe({
        next: () => {
          this.mostrarMensaje('Producto eliminado exitosamente', 'success');
          this.cargarProductos(); // Recargar lista
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.mostrarMensaje('Error al eliminar el producto', 'error');
        }
      });
    }
  }

  /* ===== MENSAJES ===== */
  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}