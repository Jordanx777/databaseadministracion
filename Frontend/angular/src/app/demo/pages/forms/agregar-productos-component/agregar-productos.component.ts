// src/app/modules/productos/components/agregar-productos/agregar-productos.component.ts

import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

/* Angular Material */
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

/* Servicios */
import { ProductosService } from 'src/app/@theme/services/Productos.service';
import { CategoriasService, Categoria } from 'src/app/@theme/services/Categorias.service';
import { SubcategoriasService, Subcategoria } from 'src/app/@theme/services/Subcategorias.service';
import { MarcasService, Marca } from 'src/app/@theme/services/Marcas.service';
import { ProveedoresService, Proveedor } from 'src/app/@theme/services/Proveedores.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-agregar-productos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './agregar-productos.component.html',
  styleUrls: ['./agregar-productos.component.scss'],
})
export class AgregarProductosComponent implements OnInit {

  formAgregar!: FormGroup;

  // Modales
  @ViewChild('modalCategoria') modalCategoria!: TemplateRef<any>;
  @ViewChild('modalSubcategoria') modalSubcategoria!: TemplateRef<any>;
  @ViewChild('modalMarca') modalMarca!: TemplateRef<any>;
  @ViewChild('modalProveedor') modalProveedor!: TemplateRef<any>;

  dialogRefCategoria!: MatDialogRef<any>;
  dialogRefSubcategoria!: MatDialogRef<any>;
  dialogRefMarca!: MatDialogRef<any>;
  dialogRefProveedor!: MatDialogRef<any>;

  // Formularios de modales
  formCategoria!: FormGroup;
  formSubcategoria!: FormGroup;
  formMarca!: FormGroup;
  formProveedor!: FormGroup;

  modoFormulario: 'agregar' | 'editar' = 'agregar';
  idEdicion: number | null = null;

  categorias: Categoria[] = [];
  subcategorias: Subcategoria[] = [];
  subcategoriasFiltradas: Subcategoria[] = [];
  marcas: Marca[] = [];
  proveedores: Proveedor[] = [];

  tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  generos = ['Hombre', 'Mujer', 'Unisex', 'Niño', 'Niña'];

  archivoSeleccionado: File | null = null;
  vistaPrevia: string | null = null;

  cargando = false;
  cargandoDatos = false;
  guardandoModal = false;

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private subcategoriasService: SubcategoriasService,
    private marcasService: MarcasService,
    private proveedoresService: ProveedoresService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.crearFormularios();
    this.cargarDatosIniciales();

    this.activatedRoute.params.subscribe(params => {
      if (params['id']) {
        this.modoFormulario = 'editar';
        this.idEdicion = +params['id'];
        this.cargarProducto(this.idEdicion);
      }
    });
  }

  // ─── FORMULARIOS ────────────────────────────────────────────────────────────

  crearFormularios(): void {
    // Formulario principal
    this.formAgregar = this.fb.group({
      nombre: ['', Validators.required],
      categoria_id: ['', Validators.required],
      subcategoria_id: [{ value: '', disabled: true }],
      marca_id: [''], // ✅ Opcional
      proveedor_id: [''], // ✅ Opcional
      genero: ['', Validators.required], // ✅ Género en el producto padre
      imagen_url: [''],
      precio_compra: [0], // ✅ Opcional
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      variantes: this.fb.array([this.crearVariante()])
    });

    this.formAgregar.get('categoria_id')?.valueChanges.subscribe(categoriaId => {
      const ctrl = this.formAgregar.get('subcategoria_id');
      if (categoriaId) {
        ctrl?.enable();
        this.filtrarSubcategorias(categoriaId);
      } else {
        ctrl?.disable();
        this.subcategoriasFiltradas = [];
      }
      this.formAgregar.patchValue({ subcategoria_id: '' }, { emitEvent: false });
    });

    // Formularios de modales
    this.formCategoria = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });

    this.formSubcategoria = this.fb.group({
      categoria_id: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });

    this.formMarca = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['']
    });

    this.formProveedor = this.fb.group({
      nombre: ['', Validators.required],
      nit: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [''],
      ciudad: [''],
      observaciones: ['']
    });
  }

  /** ✅ Variante sin genero */
  crearVariante(): FormGroup {
    return this.fb.group({
      talla: ['', Validators.required],
      color: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
    });
  }

  get variantes(): FormArray {
    return this.formAgregar.get('variantes') as FormArray;
  }

  agregarVariante(): void {
    this.variantes.push(this.crearVariante());
  }

  eliminarVariante(index: number): void {
    if (this.variantes.length > 1) {
      this.variantes.removeAt(index);
    } else {
      this.mostrarMensaje('Debe haber al menos una variante', 'warning');
    }
  }

  // ─── CARGAR DATOS INICIALES ────────────────────────────────────────────────

  cargarDatosIniciales(): void {
  setTimeout(() => {
    this.cargandoDatos = true;
    this.cdr.detectChanges();
  });
  Promise.all([
    this.categoriasService.getCategorias().toPromise(),
    this.subcategoriasService.getSubcategorias().toPromise(),
    this.marcasService.getMarcas().toPromise(),
    this.proveedoresService.getProveedoresActivos().toPromise()
  ])
    .then(([catRes, subRes, marRes, provRes]) => {
      this.categorias = this.extraerDatos(catRes);
      this.subcategorias = this.extraerDatos(subRes);
      this.marcas = this.extraerDatos(marRes);
      this.proveedores = this.extraerDatos(provRes);
      // ✅ setTimeout evita NG0100
      setTimeout(() => {
        this.cargandoDatos = false;
        this.cdr.detectChanges();
      });
    })
    .catch(error => {
      console.error('Error al cargar datos:', error);
      this.mostrarMensaje('Error al cargar los datos del formulario', 'error');
      setTimeout(() => {
        this.cargandoDatos = false;
        this.cdr.detectChanges();
      });
    });
}

  private extraerDatos(response: any): any[] {
    if (!response) return [];
    if (response.data) return Array.isArray(response.data) ? response.data : [];
    if (Array.isArray(response)) return response;
    if (response.success && response.data) return Array.isArray(response.data) ? response.data : [];
    return [];
  }

  filtrarSubcategorias(categoriaId: number): void {
    this.subcategoriasFiltradas = categoriaId
      ? this.subcategorias.filter(s => s.categoria_id === categoriaId && s.activo)
      : [];
  }

  // ─── MODALES: CATEGORÍA ─────────────────────────────────────────────────────

  abrirModalCategoria(): void {
    this.formCategoria.reset();
    this.dialogRefCategoria = this.dialog.open(this.modalCategoria, {
      width: '500px',
      disableClose: false
    });
  }

  guardarCategoria(): void {
    if (this.formCategoria.invalid) {
      this.formCategoria.markAllAsTouched();
      return;
    }

    this.guardandoModal = true;
    const datos = this.formCategoria.value;

    this.categoriasService.createCategoria(datos).subscribe({
      next: (response) => {
        this.mostrarMensaje('Categoría creada exitosamente', 'success');
        this.cerrarModalCategoria();
        this.cargarDatosIniciales(); // Recargar categorías
        this.guardandoModal = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al crear categoría', 'error');
        this.guardandoModal = false;
      }
    });
  }

  cerrarModalCategoria(): void {
    this.dialogRefCategoria?.close();
    this.formCategoria.reset();
  }

  // ─── MODALES: SUBCATEGORÍA ──────────────────────────────────────────────────

  abrirModalSubcategoria(): void {
    const categoriaId = this.formAgregar.get('categoria_id')?.value;
    if (!categoriaId) {
      this.mostrarMensaje('Primero seleccione una categoría', 'warning');
      return;
    }

    this.formSubcategoria.patchValue({ categoria_id: categoriaId });
    this.dialogRefSubcategoria = this.dialog.open(this.modalSubcategoria, {
      width: '500px',
      disableClose: false
    });
  }

  guardarSubcategoria(): void {
    if (this.formSubcategoria.invalid) {
      this.formSubcategoria.markAllAsTouched();
      return;
    }

    this.guardandoModal = true;
    const datos = this.formSubcategoria.value;

    this.subcategoriasService.createSubcategoria(datos).subscribe({
      next: (response) => {
        this.mostrarMensaje('Subcategoría creada exitosamente', 'success');
        this.cerrarModalSubcategoria();
        this.cargarDatosIniciales(); // Recargar subcategorías
        this.guardandoModal = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al crear subcategoría', 'error');
        this.guardandoModal = false;
      }
    });
  }

  cerrarModalSubcategoria(): void {
    this.dialogRefSubcategoria?.close();
    this.formSubcategoria.reset();
  }

  // ─── MODALES: MARCA ─────────────────────────────────────────────────────────

  abrirModalMarca(): void {
    this.formMarca.reset();
    this.dialogRefMarca = this.dialog.open(this.modalMarca, {
      width: '500px',
      disableClose: false
    });
  }

  guardarMarca(): void {
    if (this.formMarca.invalid) {
      this.formMarca.markAllAsTouched();
      return;
    }

    this.guardandoModal = true;
    const datos = this.formMarca.value;

    this.marcasService.createMarca(datos).subscribe({
      next: (response) => {
        this.mostrarMensaje('Marca creada exitosamente', 'success');
        this.cerrarModalMarca();
        this.cargarDatosIniciales(); // Recargar marcas
        this.guardandoModal = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al crear marca', 'error');
        this.guardandoModal = false;
      }
    });
  }

  cerrarModalMarca(): void {
    this.dialogRefMarca?.close();
    this.formMarca.reset();
  }

  // ─── MODALES: PROVEEDOR ─────────────────────────────────────────────────────

  abrirModalProveedor(): void {
    this.formProveedor.reset();
    this.dialogRefProveedor = this.dialog.open(this.modalProveedor, {
      width: '600px',
      disableClose: false
    });
  }

  guardarProveedor(): void {
    if (this.formProveedor.invalid) {
      this.formProveedor.markAllAsTouched();
      return;
    }

    this.guardandoModal = true;
    const datos = this.formProveedor.value;

    this.proveedoresService.crearProveedor(datos).subscribe({
      next: (response) => {
        if (response && response.success === false) {
          this.mostrarMensaje(response.message || 'Error al crear proveedor', 'error');
          this.guardandoModal = false;
          return;
        }
        this.mostrarMensaje('Proveedor creado exitosamente', 'success');
        this.cerrarModalProveedor();
        this.cargarDatosIniciales(); // Recargar proveedores
        this.guardandoModal = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al crear proveedor', 'error');
        this.guardandoModal = false;
      }
    });
  }

  cerrarModalProveedor(): void {
    this.dialogRefProveedor?.close();
    this.formProveedor.reset();
  }

  // ─── IMAGEN ─────────────────────────────────────────────────────────────────

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
    };
    reader.readAsDataURL(file);
  }

  limpiarImagen(): void {
    this.archivoSeleccionado = null;
    this.vistaPrevia = null;
    this.formAgregar.patchValue({ imagen_url: '' });
  }

  // ─── CARGAR PRODUCTO (modo editar) ──────────────────────────────────────────

  cargarProducto(id: number): void {
    this.cargando = true;
    this.productosService.getProducto(id).subscribe({
      next: (response) => {
        const producto = this.extraerDatosProducto(response);
        if (producto) {
          if (producto.categoria_id) this.filtrarSubcategorias(producto.categoria_id);

          // ✅ Campos del padre CON genero
          this.formAgregar.patchValue({
            nombre: producto.nombre,
            categoria_id: producto.categoria_id,
            subcategoria_id: producto.subcategoria_id,
            marca_id: producto.marca_id,
            proveedor_id: producto.proveedor_id,
            genero: producto.genero, // ✅
            imagen_url: producto.imagen_url,
            precio_compra: producto.precio_compra,
            precio_venta: producto.precio_venta,
          });

          // ✅ Variantes sin genero
          if (producto.variantes && producto.variantes.length > 0) {
            while (this.variantes.length) this.variantes.removeAt(0);
            producto.variantes.forEach((v: any) => {
              this.variantes.push(this.fb.group({
                id: [v.id],
                talla: [v.talla, Validators.required],
                color: [v.color, Validators.required],
                stock: [v.stock, [Validators.required, Validators.min(0)]],
              }));
            });
          }

          if (producto.imagen_url) {
            this.vistaPrevia = environment.imagesUrl + producto.imagen_url;
          }
        } else {
          this.mostrarMensaje('Producto no encontrado', 'error');
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar producto:', error);
        this.mostrarMensaje('Error al cargar el producto', 'error');
        this.cargando = false;
      }
    });
  }

  private extraerDatosProducto(response: any): any {
    if (!response) return null;
    if (response.data) return response.data;
    if (response.success && response.data) return response.data;
    if (response.id) return response;
    return null;
  }

  // ─── SUBMIT ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.formAgregar.invalid) {
      this.formAgregar.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    this.cargando = true;
    const fv = this.formAgregar.getRawValue();

    const formData = new FormData();

    // ✅ Campos del padre CON genero
    formData.append('nombre', fv.nombre);
    formData.append('categoria_id', fv.categoria_id.toString());
    formData.append('genero', fv.genero); // ✅
    formData.append('precio_venta', fv.precio_venta.toString());

    if (fv.subcategoria_id) {
      formData.append('subcategoria_id', fv.subcategoria_id.toString());
    }
    if (fv.marca_id) {
      formData.append('marca_id', fv.marca_id.toString());
    }
    if (fv.proveedor_id) {
      formData.append('proveedor_id', fv.proveedor_id.toString());
    }
    if (fv.precio_compra) {
      formData.append('precio_compra', fv.precio_compra.toString());
    }

    // ✅ Variantes sin genero: [{talla, color, stock}, ...]
    formData.append('variantes', JSON.stringify(fv.variantes));

    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }

    const operacion$ = this.modoFormulario === 'agregar'
      ? this.productosService.crearProducto(formData)
      : this.productosService.actualizarProducto(this.idEdicion!, formData);

    operacion$.subscribe({
      next: (response) => {
        if (this.verificarExito(response)) {
          const msg = this.modoFormulario === 'agregar'
            ? 'Producto creado exitosamente'
            : 'Producto actualizado exitosamente';
          this.mostrarMensaje(msg, 'success');
          setTimeout(() => this.router.navigate(['component/producto']), 500);
        } else {
          this.mostrarMensaje(response.message || 'Error al guardar el producto', 'error');
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al guardar el producto', 'error');
        this.cargando = false;
      }
    });
  }

  private verificarExito(response: any): boolean {
    if (!response) return false;
    if (response.hasOwnProperty('success')) return response.success === true;
    if (response.id || response.data?.id) return true;
    return true;
  }

  cancelar(): void {
    this.router.navigate(['component/producto']);
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