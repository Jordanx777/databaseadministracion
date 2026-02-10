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

  /** LOADING */
  cargando = false;
  cargandoDatos = true;

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef // Agregar ChangeDetectorRef
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
      subcategoria_id: [''],
      marca_id: ['', Validators.required],
      talla: ['', Validators.required],
      color: ['', Validators.required],
      genero: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      precio_compra: [0, [Validators.required, Validators.min(0)]],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      proveedor_id: ['', Validators.required],
    });

    // Listener para filtrar subcategorías cuando cambia la categoría
    this.formAgregar.get('categoria_id')?.valueChanges.subscribe(categoriaId => {
      this.filtrarSubcategorias(categoriaId);
      // Resetear subcategoría cuando cambia la categoría
      this.formAgregar.patchValue({ subcategoria_id: '' });
    });
  }

  /** CARGAR DATOS INICIALES - CORREGIDO */
  cargarDatosIniciales(): void {
    this.cargandoDatos = true;

    // Cargar todas las listas en paralelo
    Promise.all([
      this.productosService.getCategorias().toPromise(),
      this.productosService.getSubcategorias().toPromise(),
      this.productosService.getMarcas().toPromise(),
      this.productosService.getProveedores().toPromise()
    ])
    .then(([catRes, subRes, marRes, provRes]) => {
      // Manejar diferentes estructuras de respuesta
      this.categorias = this.extraerDatos(catRes);
      this.subcategorias = this.extraerDatos(subRes);
      this.marcas = this.extraerDatos(marRes);
      this.proveedores = this.extraerDatos(provRes);
      
      // Usar setTimeout para evitar el error de ExpressionChanged
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

  /** EXTRAER DATOS DE LA RESPUESTA - NUEVO MÉTODO */
  private extraerDatos(response: any): any[] {
    // Si la respuesta es null o undefined, retornar array vacío
    if (!response) {
      return [];
    }
    
    // Si la respuesta tiene la propiedad 'data'
    if (response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    
    // Si la respuesta es directamente un array
    if (Array.isArray(response)) {
      return response;
    }
    
    // Si tiene 'success' y 'data'
    if (response.success && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    
    // Por defecto retornar array vacío
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

  /** CARGAR PRODUCTO PARA EDITAR - CORREGIDO */
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
          
          // Luego cargar los datos
          this.formAgregar.patchValue({
            nombre: producto.nombre,
            categoria_id: producto.categoria_id,
            subcategoria_id: producto.subcategoria_id,
            marca_id: producto.marca_id,
            talla: producto.talla,
            color: producto.color,
            genero: producto.genero,
            stock: producto.stock,
            precio_compra: producto.precio_compra,
            precio_venta: producto.precio_venta,
            proveedor_id: producto.proveedor_id
          });
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

  /** EXTRAER DATOS DEL PRODUCTO - NUEVO MÉTODO */
  private extraerDatosProducto(response: any): any {
    if (!response) return null;
    
    if (response.data) {
      return response.data;
    }
    
    if (response.success && response.data) {
      return response.data;
    }
    
    // Si la respuesta es directamente el producto
    if (response.id) {
      return response;
    }
    
    return null;
  }

  /** GUARDAR PRODUCTO - CORREGIDO */
  onSubmit(): void {
    if (this.formAgregar.invalid) {
      this.formAgregar.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    this.cargando = true;
    const producto = { ...this.formAgregar.value };

    // Convertir valores numéricos
    producto.stock = parseInt(producto.stock);
    producto.precio_compra = parseFloat(producto.precio_compra);
    producto.precio_venta = parseFloat(producto.precio_venta);

    // Convertir string vacío a null para subcategoria_id si no está seleccionada
    if (!producto.subcategoria_id || producto.subcategoria_id === '') {
      producto.subcategoria_id = null;
    }

    const operacion$ = this.modoFormulario === 'agregar'
      ? this.productosService.crearProducto(producto)
      : this.productosService.actualizarProducto(this.idEdicion!, producto);

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
            this.router.navigate(['/productos']);
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

  /** VERIFICAR ÉXITO DE LA RESPUESTA - NUEVO MÉTODO */
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
    this.router.navigate(['/productos']);
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