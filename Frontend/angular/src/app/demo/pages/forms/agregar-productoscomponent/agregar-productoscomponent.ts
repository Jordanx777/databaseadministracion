import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

/* Servicios */
import { ProductosService, Categoria, Subcategoria, Marca, Proveedor } from 'src/app/@theme/services/Productos.service';

// variables de entorno
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
    MatSnackBarModule
  ],
  templateUrl: './agregar-productoscomponent.html',
  styleUrl: './agregar-productoscomponent.scss',
})
export class AgregarProductoscomponent implements OnInit {

  /** FORMULARIO */
  formAgregar!: FormGroup;

  /** MODO */
  modoFormulario: 'agregar' | 'editar' = 'agregar';
  idEdicion: number | null = null;

  /** DATOS DEL BACKEND */
  categorias: Categoria[] = [];
  subcategorias: Subcategoria[] = [];
  subcategoriasFiltradas: Subcategoria[] = [];
  marcas: Marca[] = [];
  proveedores: Proveedor[] = [];

  /** TALLAS Y GÉNEROS */
  tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  generos = ['Hombre', 'Mujer', 'Unisex', 'Niño', 'Niña'];

  /** IMAGEN */
  archivoSeleccionado: File | null = null;
  vistaPrevia: string | null = null;

  /** LOADING */
  cargando = false;
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
    
    // Verificar si estamos en modo edición
    this.activatedRoute.params.subscribe(params => {
      if (params['id']) {
        this.modoFormulario = 'editar';
        this.idEdicion = +params['id'];
        this.cargarProducto(this.idEdicion);
      }
    });
  }

  crearFormulario(): void {
    this.formAgregar = this.fb.group({
      nombre: ['', Validators.required],
      categoria_id: ['', Validators.required],
      subcategoria_id: [{value: '', disabled: true}], 
      marca_id: ['', Validators.required],
      talla: ['', Validators.required],
      color: ['', Validators.required],
      genero: [''],
      imagen_url: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      precio_compra: [0, [Validators.required, Validators.min(0)]],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      proveedor_id: ['', Validators.required],
    });

    // Listener para habilitar/deshabilitar subcategoría
  this.formAgregar.get('categoria_id')?.valueChanges.subscribe(categoriaId => {
    const subcategoriaControl = this.formAgregar.get('subcategoria_id');
    
    if (categoriaId) {
      subcategoriaControl?.enable(); // ✅ Habilitar
      this.filtrarSubcategorias(categoriaId);
    } else {
      subcategoriaControl?.disable(); // ✅ Deshabilitar
      this.subcategoriasFiltradas = [];
    }
    
    // Resetear valor
    this.formAgregar.patchValue({ subcategoria_id: '' }, { emitEvent: false });
  });
}
  

  /** CARGAR DATOS INICIALES */
  cargarDatosIniciales(): void {
    this.cargandoDatos = true;

    Promise.all([
      this.productosService.getCategorias().toPromise(),
      this.productosService.getSubcategorias().toPromise(),
      this.productosService.getMarcas().toPromise(),
      this.productosService.getProveedoresActivos().toPromise()
    ])
    .then(([catRes, subRes, marRes, provRes]) => {
      this.categorias = this.extraerDatos(catRes);
      this.subcategorias = this.extraerDatos(subRes);
      this.marcas = this.extraerDatos(marRes);
      this.proveedores = this.extraerDatos(provRes);
      
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

  /** EXTRAER DATOS DE LA RESPUESTA */
  private extraerDatos(response: any): any[] {
    if (!response) {
      return [];
    }
    
    if (response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    
    return [];
  }

  /** FILTRAR SUBCATEGORÍAS SEGÚN CATEGORÍA */
  filtrarSubcategorias(categoriaId: number): void {
    if (categoriaId) {
      this.subcategoriasFiltradas = this.subcategorias.filter(
        sub => sub.categoria_id === categoriaId && sub.activo
      );
    } else {
      this.subcategoriasFiltradas = [];
    }
  }

  /** MANEJAR SELECCIÓN DE ARCHIVO */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        this.mostrarMensaje('Solo se permiten imágenes (JPG, PNG, WEBP)', 'error');
        event.target.value = ''; // Limpiar input
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarMensaje('La imagen no debe superar los 5MB', 'error');
        event.target.value = ''; // Limpiar input
        return;
      }

      this.archivoSeleccionado = file;

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.vistaPrevia = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /** LIMPIAR IMAGEN */
  limpiarImagen(): void {
    this.archivoSeleccionado = null;
    this.vistaPrevia = null;
    this.formAgregar.patchValue({ imagen_url: '' });
  }

  /** CARGAR PRODUCTO PARA EDITAR */
  cargarProducto(id: number): void {
    this.cargando = true;
    this.productosService.getProducto(id).subscribe({
      next: (response) => {
        const producto = this.extraerDatosProducto(response);
        
        if (producto) {
          // Primero filtrar subcategorías si hay categoría
          if (producto.categoria_id) {
            this.filtrarSubcategorias(producto.categoria_id);
          }
          
          // Cargar los datos
          this.formAgregar.patchValue({
            nombre: producto.nombre,
            categoria_id: producto.categoria_id,
            subcategoria_id: producto.subcategoria_id,
            marca_id: producto.marca_id,
            talla: producto.talla,
            color: producto.color,
            genero: producto.genero,
            imagen_url: producto.imagen_url,
            stock: producto.stock,
            precio_compra: producto.precio_compra,
            precio_venta: producto.precio_venta,
            proveedor_id: producto.proveedor_id
          });

          // Si hay imagen, mostrar vista previa con la URL completa
          if (producto.imagen_url) {
            // Asumiendo que tu API devuelve la ruta relativa de la imagen, concatenamos con la URL base de imágenes
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

  /** EXTRAER DATOS DEL PRODUCTO */
  private extraerDatosProducto(response: any): any {
    if (!response) return null;
    
    if (response.data) {
      return response.data;
    }
    
    if (response.success && response.data) {
      return response.data;
    }
    
    if (response.id) {
      return response;
    }
    
    return null;
  }

  /** GUARDAR PRODUCTO */
  onSubmit(): void {
    if (this.formAgregar.invalid) {
      this.formAgregar.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    this.cargando = true;

    // Crear FormData para enviar archivo
    const formData = new FormData();
    
    // Agregar todos los campos del formulario
    const formValues = this.formAgregar.value;
    
    formData.append('nombre', formValues.nombre);
    formData.append('categoria_id', formValues.categoria_id.toString());
    formData.append('marca_id', formValues.marca_id.toString());
    formData.append('talla', formValues.talla);
    formData.append('color', formValues.color);
    formData.append('stock', formValues.stock.toString());
    formData.append('precio_compra', formValues.precio_compra.toString());
    formData.append('precio_venta', formValues.precio_venta.toString());
    formData.append('proveedor_id', formValues.proveedor_id.toString());

    // Campos opcionales
    if (formValues.subcategoria_id) {
      formData.append('subcategoria_id', formValues.subcategoria_id.toString());
    }
    
    if (formValues.genero) {
      formData.append('genero', formValues.genero);
    }

    // Agregar la imagen si existe
    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }

    // Log para debug
    formData.forEach((value, key) => {
    });

    const operacion$ = this.modoFormulario === 'agregar'
      ? this.productosService.crearProducto(formData)
      : this.productosService.actualizarProducto(this.idEdicion!, formData);

    operacion$.subscribe({
      next: (response) => {
        const success = this.verificarExito(response);
        
        if (success) {
          const mensaje = this.modoFormulario === 'agregar' 
            ? 'Producto creado exitosamente' 
            : 'Producto actualizado exitosamente';
          this.mostrarMensaje(mensaje, 'success');
          
          // Navegar después de un pequeño delay
          setTimeout(() => {
            this.router.navigate(['component/producto']);
          }, 500);
        } else {
          const mensaje = response.message || 
            (this.modoFormulario === 'agregar' 
              ? 'Error al crear producto' 
              : 'Error al actualizar producto');
          this.mostrarMensaje(mensaje, 'error');
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error:', error);
        const mensaje = this.modoFormulario === 'agregar' 
          ? 'Error al crear el producto' 
          : 'Error al actualizar el producto';
        this.mostrarMensaje(mensaje, 'error');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** VERIFICAR ÉXITO DE LA RESPUESTA */
  private verificarExito(response: any): boolean {
    if (!response) return false;
    
    // Si tiene propiedad success
    if (response.hasOwnProperty('success')) {
      return response.success === true;
    }
    
    // Si la respuesta tiene un ID, asumimos que fue exitoso
    if (response.id || response.data?.id) {
      return true;
    }
    
    // Por defecto, asumir que fue exitoso si no hay error
    return true;
  }

  /** CANCELAR */
  cancelar(): void {
    this.router.navigate(['component/addproducto']);
  }

  /** MOSTRAR MENSAJE */
  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}