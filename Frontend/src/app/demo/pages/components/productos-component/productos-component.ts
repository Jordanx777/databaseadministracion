import {
  Component,
  AfterViewInit,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy   // ✅ importado
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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

/* ===== SERVICIOS ===== */
import { ProductosService } from 'src/app/@theme/services/Productos.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-productos-component',
  standalone: true,
  templateUrl: './productos-component.html',
  styleUrls: ['./productos-component.scss'],
  // ✅ OnPush previene el NG0100: Angular solo chequea cuando
  //    llamamos markForCheck() manualmente
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
  ]
})
export class ProductosComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'imagen',
    'nombre',
    'categoria',
    'variantes',
    'genero',
    'stock_total',
    'precio_compra',
    'precio_venta',
    'proveedor',
    'acciones'
  ];

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;

  // ✅ Empieza en true — no hay cambio false→true que dispare el error
  cargando = true;

  baseUrlImagenes = environment.imagesUrl;

  readonly CHIPS_VISIBLES = 3;
  expandidos = new Map<number, boolean>();

  constructor(
    private productosService: ProductosService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {
    this.configurarFiltro();
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort      = this.sort;
  }

  // ─── CARGA ────────────────────────────────────────────────────────────────

  cargarProductos(): void {
    // ✅ No hace falta setear cargando=true aquí (ya arranca en true)
    //    pero sí al recargar (ej: tras eliminar)
    this.cargando = true;
    this.cdr.markForCheck();   // ✅ avisa a OnPush que revise

    this.productosService.getProductos().subscribe({
      next: (response) => {
        const productos = this.extraerDatos(response);

        productos.forEach(p => {
          if (p.stock_total === undefined) {
            p.stock_total = (p.variantes ?? []).reduce(
              (sum: number, v: any) => sum + (v.stock ?? 0), 0
            );
          }
        });

        this.dataSource.data = productos;
        this.cargando = false;
        this.cdr.markForCheck();   // ✅ dispara re-render limpio
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.mostrarMensaje('Error al cargar los productos', 'error');
        this.cargando = false;
        this.cdr.markForCheck();   // ✅ ídem
      }
    });
  }

  private extraerDatos(response: any): any[] {
    if (response?.data) return Array.isArray(response.data) ? response.data : [];
    if (Array.isArray(response)) return response;
    return [];
  }

  // ─── VARIANTES ────────────────────────────────────────────────────────────

  variantesVisibles(producto: any): any[] {
    const variantes: any[] = producto.variantes ?? [];
    return this.expandidos.get(producto.id) ? variantes : variantes.slice(0, this.CHIPS_VISIBLES);
  }

  variantesOcultas(producto: any): number {
    return Math.max(0, (producto.variantes ?? []).length - this.CHIPS_VISIBLES);
  }

  toggleExpandir(productoId: number): void {
    this.expandidos.set(productoId, !this.expandidos.get(productoId));
    this.cdr.markForCheck();   // ✅ necesario con OnPush
  }

  chipLabel(v: any): string {
    return `${v.talla} / ${v.color}  ×${v.stock}`;
  }

  chipColor(v: any): 'primary' | 'warn' | 'accent' {
    if (v.stock === 0) return 'warn';
    if (v.stock < 5)  return 'accent';
    return 'primary';
  }

  // ─── IMAGEN ───────────────────────────────────────────────────────────────

  getImagenUrl(producto: any): string {
    return producto.imagen_url
      ? this.baseUrlImagenes + producto.imagen_url
      : 'assets/images/no-image.png';
  }

  // ─── FILTRO ───────────────────────────────────────────────────────────────

  configurarFiltro(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const variantesTexto = (data.variantes ?? [])
        .map((v: any) => `${v.talla} ${v.color}`)
        .join(' ');

      const texto = `
        ${data.nombre          || ''}
        ${data.categoria_nombre || ''}
        ${data.marca_nombre     || ''}
        ${data.proveedor_nombre || ''}
        ${variantesTexto}
      `.toLowerCase();

      return texto.includes(filter);
    };
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.paginator) this.paginator.firstPage();
  }

  // ─── ACCIONES ─────────────────────────────────────────────────────────────

  agregarProducto(): void {
    this.router.navigate(['component/addproducto']);
  }

  /** ✅ Redirige a la ruta component/addproducto/:id */
  editarProducto(producto: any): void {
    this.router.navigate(['component/addproducto', producto.id]);
  }

  eliminarProducto(producto: any): void {
    if (confirm(`¿Estás seguro de eliminar "${producto.nombre}"?`)) {
      this.productosService.eliminarProducto(producto.id).subscribe({
        next: () => {
          this.mostrarMensaje('Producto eliminado exitosamente', 'success');
          this.cargarProductos();
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          this.mostrarMensaje('Error al eliminar el producto', 'error');
        }
      });
    }
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}