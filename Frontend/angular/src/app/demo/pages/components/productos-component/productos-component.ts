import {
  Component,
  AfterViewInit,
  ViewChild,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

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
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

/* ===== SERVICIOS ===== */
import {
  ProductosService,
  Producto,
  Categoria,
  Subcategoria,
  Marca,
  Proveedor
} from 'src/app/@theme/services/Productos.service';
import { environment } from 'src/environments/environment';

/* ===== MODAL COMPONENT ===== */
import { TemplateRef } from '@angular/core';

@Component({
  selector: 'app-productos-component',
  standalone: true,
  templateUrl: './productos-component.html',
  styleUrls: ['./productos-component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    MatDialogModule,
    MatSelectModule,
    MatTooltipModule,
    MatDividerModule
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
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('modalEditar') modalEditar!: TemplateRef<any>;

  /* ===== MODAL ===== */
  dialogRef!: MatDialogRef<any>;
  productoEditando: any = null;

  /* ===== FORMULARIO EDICIÓN ===== */
  formEditar!: FormGroup;

  /* ===== DATOS SELECT ===== */
  categorias: Categoria[] = [];
  subcategorias: Subcategoria[] = [];
  subcategoriasFiltradas: Subcategoria[] = [];
  marcas: Marca[] = [];
  proveedores: Proveedor[] = [];
  tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  generos = ['Hombre', 'Mujer', 'Unisex', 'Niño', 'Niña'];

  /* ===== IMAGEN ===== */
  archivoSeleccionado: File | null = null;
  vistaPrevia: string | null = null;

  /* ===== LOADING ===== */
  cargando = true;
  cargandoModal = false;
  cargandoDatosModal = false;

  /* ===== URL DE IMÁGENES ===== */
  baseUrlImagenes = environment.imagesUrl;

  constructor(
    private productosService: ProductosService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.configurarFiltro();
    this.crearFormulario();
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarDatosSelects();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /* ===== FORMULARIO ===== */
  crearFormulario(): void {
    this.formEditar = this.fb.group({
      nombre:       ['', Validators.required],
      categoria_id: ['', Validators.required],
      subcategoria_id: [{ value: '', disabled: true }],
      marca_id:     ['', Validators.required],
      talla:        ['', Validators.required],
      color:        ['', Validators.required],
      genero:       [''],
      stock:        [0, [Validators.required, Validators.min(0)]],
      precio_compra:[0, [Validators.required, Validators.min(0)]],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      proveedor_id: ['', Validators.required],
    });

    // Habilitar/deshabilitar subcategoría según categoría
    this.formEditar.get('categoria_id')?.valueChanges.subscribe(catId => {
      const subCtrl = this.formEditar.get('subcategoria_id');
      if (catId) {
        subCtrl?.enable();
        this.filtrarSubcategorias(catId);
      } else {
        subCtrl?.disable();
        this.subcategoriasFiltradas = [];
      }
      this.formEditar.patchValue({ subcategoria_id: '' }, { emitEvent: false });
    });
  }

  /* ===== CARGAR DATOS SELECTS ===== */
  cargarDatosSelects(): void {
    this.cargandoDatosModal = true;

    Promise.all([
      this.productosService.getCategorias().toPromise(),
      this.productosService.getSubcategorias().toPromise(),
      this.productosService.getMarcas().toPromise(),
      this.productosService.getProveedoresActivos().toPromise()
    ]).then(([catRes, subRes, marRes, provRes]) => {
      this.categorias   = this.extraerDatos(catRes);
      this.subcategorias = this.extraerDatos(subRes);
      this.marcas       = this.extraerDatos(marRes);
      this.proveedores  = this.extraerDatos(provRes);
      this.cargandoDatosModal = false;
    }).catch(err => {
      console.error('Error cargando selects:', err);
      this.cargandoDatosModal = false;
    });
  }

  filtrarSubcategorias(categoriaId: number): void {
    this.subcategoriasFiltradas = this.subcategorias.filter(
      s => s.categoria_id === categoriaId && s.activo
    );
  }

  /* ===== CARGAR PRODUCTOS ===== */
  cargarProductos(): void {
    this.cargando = true;
    this.productosService.getProductos().subscribe({
      next: (response) => {
        const productos = this.extraerDatos(response);
        this.dataSource.data = productos;
        setTimeout(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        }, 100);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.mostrarMensaje('Error al cargar los productos', 'error');
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

  /* ===== IMAGEN ===== */
  getImagenUrl(producto: any): string {
    if (producto.imagen_url) {
      return this.baseUrlImagenes + producto.imagen_url;
    }
    return 'assets/images/no-image.png';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      this.mostrarMensaje('Solo se permiten imágenes (JPG, PNG, WEBP)', 'error');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.mostrarMensaje('La imagen no debe superar los 5MB', 'error');
      event.target.value = '';
      return;
    }

    this.archivoSeleccionado = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.vistaPrevia = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  limpiarImagen(): void {
    this.archivoSeleccionado = null;
    this.vistaPrevia = this.productoEditando?.imagen_url
      ? this.baseUrlImagenes + this.productoEditando.imagen_url
      : null;
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
    if (this.paginator) this.paginator.firstPage();
  }

  /* ===== ACCIONES ===== */
  agregarProducto(): void {
    this.router.navigate(['component/addproducto']);
  }

  /* ===== ABRIR MODAL EDITAR ===== */
  editarProducto(producto: any): void {
    this.productoEditando = producto;
    this.archivoSeleccionado = null;

    // Cargar imagen actual como vista previa
    this.vistaPrevia = producto.imagen_url
      ? this.baseUrlImagenes + producto.imagen_url
      : null;

    // Filtrar subcategorías para la categoría actual
    if (producto.categoria_id) {
      this.filtrarSubcategorias(producto.categoria_id);
      this.formEditar.get('subcategoria_id')?.enable();
    }

    // Cargar datos en el formulario
    this.formEditar.patchValue({
      nombre:          producto.nombre,
      categoria_id:    producto.categoria_id,
      subcategoria_id: producto.subcategoria_id || '',
      marca_id:        producto.marca_id,
      talla:           producto.talla,
      color:           producto.color,
      genero:          producto.genero || '',
      stock:           producto.stock,
      precio_compra:   producto.precio_compra,
      precio_venta:    producto.precio_venta,
      proveedor_id:    producto.proveedor_id,
    });

    // Abrir modal
    this.dialogRef = this.dialog.open(this.modalEditar, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'modal-editar-producto',
      disableClose: false
    });
  }

  cerrarModal(): void {
    this.dialogRef?.close();
    this.formEditar.reset();
    this.archivoSeleccionado = null;
    this.vistaPrevia = null;
    this.productoEditando = null;
    this.subcategoriasFiltradas = [];
  }

  /* ===== GUARDAR EDICIÓN ===== */
  guardarEdicion(): void {
    if (this.formEditar.invalid) {
      this.formEditar.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    this.cargandoModal = true;
    const formValues = this.formEditar.getRawValue(); // getRawValue incluye campos disabled

    const formData = new FormData();
    formData.append('nombre',        formValues.nombre);
    formData.append('categoria_id',  formValues.categoria_id.toString());
    formData.append('marca_id',      formValues.marca_id.toString());
    formData.append('talla',         formValues.talla);
    formData.append('color',         formValues.color);
    formData.append('stock',         formValues.stock.toString());
    formData.append('precio_compra', formValues.precio_compra.toString());
    formData.append('precio_venta',  formValues.precio_venta.toString());
    formData.append('proveedor_id',  formValues.proveedor_id.toString());

    if (formValues.subcategoria_id) {
      formData.append('subcategoria_id', formValues.subcategoria_id.toString());
    }
    if (formValues.genero) {
      formData.append('genero', formValues.genero);
    }

    // Solo agregar imagen si se seleccionó una nueva
    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }

    this.productosService.actualizarProducto(this.productoEditando.id, formData).subscribe({
      next: (response) => {
        this.mostrarMensaje('Producto actualizado exitosamente', 'success');
        this.cerrarModal();
        this.cargarProductos(); // Recargar la tabla
        this.cargandoModal = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.mostrarMensaje('Error al actualizar el producto', 'error');
        this.cargandoModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* ===== ELIMINAR ===== */
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