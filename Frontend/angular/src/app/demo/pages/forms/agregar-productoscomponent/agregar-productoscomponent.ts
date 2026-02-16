import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

/* Servicios */
import { ProductosService, Categoria, Subcategoria, Marca, Proveedor } from 'src/app/@theme/services/Productos.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-agregar-productoscomponent',
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
  ],
  templateUrl: './agregar-productoscomponent.html',
  styleUrl: './agregar-productoscomponent.scss',
})
export class AgregarProductoscomponent implements OnInit {

  formAgregar!: FormGroup;

  modoFormulario: 'agregar' | 'editar' = 'agregar';
  idEdicion: number | null = null;

  categorias: Categoria[]              = [];
  subcategorias: Subcategoria[]        = [];
  subcategoriasFiltradas: Subcategoria[] = [];
  marcas: Marca[]                      = [];
  proveedores: Proveedor[]             = [];

  tallas  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  // generos sigue aquí, ahora se usa dentro de CADA VARIANTE
  generos = ['Hombre', 'Mujer', 'Unisex', 'Niño', 'Niña'];

  archivoSeleccionado: File | null = null;
  vistaPrevia: string | null = null;

  cargando      = false;
  cargandoDatos = true;

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.crearFormulario();
    this.cargarDatosIniciales();

    this.activatedRoute.params.subscribe(params => {
      if (params['id']) {
        this.modoFormulario = 'editar';
        this.idEdicion = +params['id'];
        this.cargarProducto(this.idEdicion);
      }
    });
  }

  // ─── FORMULARIO ────────────────────────────────────────────────────────────

  crearFormulario(): void {
    this.formAgregar = this.fb.group({
      nombre:          ['', Validators.required],
      categoria_id:    ['', Validators.required],
      subcategoria_id: [{ value: '', disabled: true }],
      marca_id:        ['', Validators.required],
      imagen_url:      [''],
      precio_compra:   [0, [Validators.required, Validators.min(0)]],
      precio_venta:    [0, [Validators.required, Validators.min(0)]],
      proveedor_id:    ['', Validators.required],
      // ✅ genero YA NO está en el padre
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
  }

  /** ✅ Variante ahora incluye genero */
  crearVariante(): FormGroup {
    return this.fb.group({
      talla:  ['', Validators.required],
      color:  ['', Validators.required],
      genero: ['', Validators.required],
      stock:  [0, [Validators.required, Validators.min(0)]],
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

  // ─── DATOS INICIALES ───────────────────────────────────────────────────────

  cargarDatosIniciales(): void {
    this.cargandoDatos = true;
    Promise.all([
      this.productosService.getCategorias().toPromise(),
      this.productosService.getSubcategorias().toPromise(),
      this.productosService.getMarcas().toPromise(),
      this.productosService.getProveedoresActivos().toPromise()
    ])
    .then(([catRes, subRes, marRes, provRes]) => {
      this.categorias    = this.extraerDatos(catRes);
      this.subcategorias = this.extraerDatos(subRes);
      this.marcas        = this.extraerDatos(marRes);
      this.proveedores   = this.extraerDatos(provRes);
      setTimeout(() => { this.cargandoDatos = false; this.cdr.detectChanges(); });
    })
    .catch(error => {
      console.error('Error al cargar datos:', error);
      this.mostrarMensaje('Error al cargar los datos del formulario', 'error');
      setTimeout(() => { this.cargandoDatos = false; this.cdr.detectChanges(); });
    });
  }

  private extraerDatos(response: any): any[] {
    if (!response)                         return [];
    if (response.data)                     return Array.isArray(response.data) ? response.data : [];
    if (Array.isArray(response))           return response;
    if (response.success && response.data) return Array.isArray(response.data) ? response.data : [];
    return [];
  }

  filtrarSubcategorias(categoriaId: number): void {
    this.subcategoriasFiltradas = categoriaId
      ? this.subcategorias.filter(s => s.categoria_id === categoriaId && s.activo)
      : [];
  }

  // ─── IMAGEN ────────────────────────────────────────────────────────────────

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
    reader.onload = (e: any) => { this.vistaPrevia = e.target.result; };
    reader.readAsDataURL(file);
  }

  limpiarImagen(): void {
    this.archivoSeleccionado = null;
    this.vistaPrevia = null;
    this.formAgregar.patchValue({ imagen_url: '' });
  }

  // ─── CARGAR PRODUCTO (modo editar) ─────────────────────────────────────────

  cargarProducto(id: number): void {
    this.cargando = true;
    this.productosService.getProducto(id).subscribe({
      next: (response) => {
        const producto = this.extraerDatosProducto(response);
        if (producto) {
          if (producto.categoria_id) this.filtrarSubcategorias(producto.categoria_id);

          // ✅ Campos del padre — sin genero
          this.formAgregar.patchValue({
            nombre:          producto.nombre,
            categoria_id:    producto.categoria_id,
            subcategoria_id: producto.subcategoria_id,
            marca_id:        producto.marca_id,
            imagen_url:      producto.imagen_url,
            precio_compra:   producto.precio_compra,
            precio_venta:    producto.precio_venta,
            proveedor_id:    producto.proveedor_id,
          });

          // ✅ Variantes con genero incluido
          if (producto.variantes && producto.variantes.length > 0) {
            while (this.variantes.length) this.variantes.removeAt(0);
            producto.variantes.forEach((v: any) => {
              this.variantes.push(this.fb.group({
                id:     [v.id],
                talla:  [v.talla,  Validators.required],
                color:  [v.color,  Validators.required],
                genero: [v.genero, Validators.required],
                stock:  [v.stock,  [Validators.required, Validators.min(0)]],
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
        this.cdr.detectChanges();
      }
    });
  }

  private extraerDatosProducto(response: any): any {
    if (!response)                         return null;
    if (response.data)                     return response.data;
    if (response.success && response.data) return response.data;
    if (response.id)                       return response;
    return null;
  }

  // ─── SUBMIT ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.formAgregar.invalid) {
      this.formAgregar.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    this.cargando = true;
    const fv = this.formAgregar.getRawValue();

    const formData = new FormData();

    // Campos del padre — ✅ sin genero
    formData.append('nombre',        fv.nombre);
    formData.append('categoria_id',  fv.categoria_id.toString());
    formData.append('marca_id',      fv.marca_id.toString());
    formData.append('precio_compra', fv.precio_compra.toString());
    formData.append('precio_venta',  fv.precio_venta.toString());
    formData.append('proveedor_id',  fv.proveedor_id.toString());

    if (fv.subcategoria_id) {
      formData.append('subcategoria_id', fv.subcategoria_id.toString());
    }

    // ✅ variantes incluyen genero: [{talla, color, genero, stock}, ...]
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
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al guardar el producto', 'error');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private verificarExito(response: any): boolean {
    if (!response) return false;
    if (response.hasOwnProperty('success')) return response.success === true;
    if (response.id || response.data?.id)   return true;
    return true;
  }

  cancelar(): void {
    this.router.navigate(['component/addproducto']);
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