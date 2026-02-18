import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

/* Servicios */
import { ProductosService } from 'src/app/@theme/services/Productos.service';
// import { ClientesService } from 'src/app/@theme/services/';
// import { VentasService } from 'src/app/@theme/services/Ventas.services'; // ← crear después

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

interface ItemCarrito {
  producto_id: number;
  variante_id: number;
  producto_nombre: string;
  marca_nombre: string;
  talla: string;
  color: string;
  genero: string;
  cantidad: number;
  precio_unitario: number;
  stock_disponible: number;
  subtotal: number;
}

@Component({
  selector: 'app-agregar-ventas',
  standalone: true,
  templateUrl: './agregar-ventas-component.html',
  styleUrls: ['./agregar-ventas-component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatRadioModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatTableModule,
    MatChipsModule,
  ]
})
export class AgregarVentasComponent implements OnInit {

  formVenta!: FormGroup;

  /* ===== DATOS ===== */
  clientes: any[] = [];
  clientesFiltrados!: Observable<any[]>;
  productos: any[] = [];
  productosFiltrados!: Observable<any[]>;

  tiposCliente = [
    { value: 'registrado', label: 'Cliente registrado' },
    { value: 'ocasional', label: 'Cliente ocasional (sin registro)' }
  ];

  tiposPago = [
    { value: 'contado', label: 'Contado (100% inmediato)' },
    { value: 'credito', label: 'Crédito (pago posterior)' },
    { value: 'mixto', label: 'Mixto (abono + saldo)' }
  ];

  metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'nequi', label: 'Nequi' },
    { value: 'daviplata', label: 'Daviplata' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'tarjeta', label: 'Tarjeta' }
  ];

  /* ===== CARRITO ===== */
  carrito: ItemCarrito[] = [];
  columnasCarrito = ['producto', 'variante', 'cantidad', 'precio_unitario', 'subtotal', 'acciones'];

  /* ===== TOTALES ===== */
  subtotal = 0;
  descuento = 0;
  total = 0;

  /* ===== LOADING ===== */
  // cargando = false;
  // cargandoDatos = true;

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    // private clientesService: ClientesService,
    // private ventasService: VentasService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.crearFormulario();
    this.cargarDatosIniciales();
    this.configurarAutocompletes();
  }

  // ─── FORMULARIO ────────────────────────────────────────────────────────────

  crearFormulario(): void {
    this.formVenta = this.fb.group({
      // Cliente
      tipo_cliente: ['registrado', Validators.required],
      cliente_id: [''],
      cliente_nombre: [''],
      cliente_telefono: [''],
      cliente_referencia: [''],

      // Producto a agregar (no va en el submit final)
      producto_busqueda: [''],
      variante_seleccionada: [''],
      cantidad_agregar: [1, [Validators.min(1)]],

      // Venta
      subtotal: [0],
      descuento: [0, [Validators.min(0)]],
      total: [0],
      tipo_pago: ['contado', Validators.required],
      notas: [''],

      // Pagos iniciales (solo si tipo_pago = contado o mixto)
      pagos: this.fb.array([])
    });

    // Listener tipo_cliente
    this.formVenta.get('tipo_cliente')?.valueChanges.subscribe(tipo => {
      const clienteIdCtrl = this.formVenta.get('cliente_id');
      const nombreCtrl = this.formVenta.get('cliente_nombre');

      if (tipo === 'registrado') {
        clienteIdCtrl?.setValidators([Validators.required]);
        nombreCtrl?.clearValidators();
      } else {
        clienteIdCtrl?.clearValidators();
        nombreCtrl?.setValidators([Validators.required]);
      }
      clienteIdCtrl?.updateValueAndValidity();
      nombreCtrl?.updateValueAndValidity();
    });

    // Listener tipo_pago
    this.formVenta.get('tipo_pago')?.valueChanges.subscribe(tipo => {
      if (tipo === 'contado') {
        // Contado: agregar pago por el total
        this.pagos.clear();
        this.agregarPago();
        this.pagos.at(0).patchValue({ monto: this.total });
      } else if (tipo === 'mixto') {
        // Mixto: permitir uno o más pagos
        if (this.pagos.length === 0) this.agregarPago();
      } else {
        // Crédito: limpiar pagos
        this.pagos.clear();
      }
    });

    // Listener descuento
    this.formVenta.get('descuento')?.valueChanges.subscribe(() => {
      this.calcularTotales();
    });
  }

  get pagos(): FormArray {
    return this.formVenta.get('pagos') as FormArray;
  }

  crearPago(): FormGroup {
    return this.fb.group({
      monto: [0, [Validators.required, Validators.min(0.01)]],
      metodo_pago: ['efectivo', Validators.required],
      referencia: [''],
      notas: ['']
    });
  }

  agregarPago(): void {
    this.pagos.push(this.crearPago());
  }

  eliminarPago(index: number): void {
    this.pagos.removeAt(index);
  }

  // ─── CARGAR DATOS ──────────────────────────────────────────────────────────

  cargarDatosIniciales(): void {
    // this.cargandoDatos = true;

    Promise.all([
      // this.clientesService.getClientes().toPromise(),
      this.productosService.getProductos().toPromise()
    ])
    // .then(([clientesRes, productosRes]) => {
    //   this.clientes = this.extraerDatos(clientesRes);
    //   this.productos = this.extraerDatos(productosRes);
    //   this.cargandoDatos = false;
    //   this.cdr.detectChanges();
    // })
    .catch(err => {
      console.error('Error cargando datos:', err);
      this.mostrarMensaje('Error al cargar datos del formulario', 'error');
      // this.cargandoDatos = false;
      this.cdr.detectChanges();
    });
  }

  private extraerDatos(response: any): any[] {
    if (response?.data) return Array.isArray(response.data) ? response.data : [];
    if (Array.isArray(response)) return response;
    return [];
  }

  // ─── AUTOCOMPLETES ─────────────────────────────────────────────────────────

  configurarAutocompletes(): void {
    // Clientes
    this.clientesFiltrados = this.formVenta.get('cliente_id')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filtrarClientes(value || ''))
    );

    // Productos
    this.productosFiltrados = this.formVenta.get('producto_busqueda')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filtrarProductos(value || ''))
    );
  }

  private _filtrarClientes(value: any): any[] {
    if (typeof value !== 'string') return this.clientes;
    const filterValue = value.toLowerCase();
    return this.clientes.filter(c =>
      c.nombre?.toLowerCase().includes(filterValue) ||
      c.apodo?.toLowerCase().includes(filterValue) ||
      c.telefono?.includes(filterValue)
    );
  }

  private _filtrarProductos(value: any): any[] {
    if (typeof value !== 'string') return this.productos;
    const filterValue = value.toLowerCase();
    return this.productos.filter(p =>
      p.nombre?.toLowerCase().includes(filterValue) ||
      p.marca_nombre?.toLowerCase().includes(filterValue)
    );
  }

  displayCliente(cliente: any): string {
    return cliente ? `${cliente.nombre}${cliente.apodo ? ' (' + cliente.apodo + ')' : ''}` : '';
  }

  displayProducto(producto: any): string {
    return producto ? `${producto.nombre} - ${producto.marca_nombre}` : '';
  }

  // ─── CARRITO ───────────────────────────────────────────────────────────────

  agregarAlCarrito(): void {
    const productoSeleccionado = this.formVenta.get('producto_busqueda')?.value;
    const varianteId = this.formVenta.get('variante_seleccionada')?.value;
    const cantidad = this.formVenta.get('cantidad_agregar')?.value;

    if (!productoSeleccionado || !varianteId || cantidad < 1) {
      this.mostrarMensaje('Seleccione producto, variante y cantidad', 'warning');
      return;
    }

    // Buscar la variante en el producto
    const variante = productoSeleccionado.variantes?.find((v: any) => v.id === varianteId);
    if (!variante) {
      this.mostrarMensaje('Variante no encontrada', 'error');
      return;
    }

    // Validar stock
    if (cantidad > variante.stock) {
      this.mostrarMensaje(`Stock insuficiente (disponible: ${variante.stock})`, 'warning');
      return;
    }

    // Verificar si ya existe en el carrito
    const existe = this.carrito.find(item =>
      item.producto_id === productoSeleccionado.id && item.variante_id === varianteId
    );

    if (existe) {
      existe.cantidad += cantidad;
      existe.subtotal = existe.cantidad * existe.precio_unitario;
    } else {
      const item: ItemCarrito = {
        producto_id: productoSeleccionado.id,
        variante_id: varianteId,
        producto_nombre: productoSeleccionado.nombre,
        marca_nombre: productoSeleccionado.marca_nombre,
        talla: variante.talla,
        color: variante.color,
        genero: variante.genero,
        cantidad: cantidad,
        precio_unitario: productoSeleccionado.precio_venta,
        stock_disponible: variante.stock,
        subtotal: cantidad * productoSeleccionado.precio_venta
      };
      this.carrito.push(item);
    }

    // Limpiar formulario de producto
    this.formVenta.patchValue({
      producto_busqueda: '',
      variante_seleccionada: '',
      cantidad_agregar: 1
    });

    this.calcularTotales();
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.splice(index, 1);
    this.calcularTotales();
  }

  actualizarCantidad(item: ItemCarrito, nuevaCantidad: number): void {
    if (nuevaCantidad < 1) {
      this.mostrarMensaje('La cantidad debe ser al menos 1', 'warning');
      return;
    }
    if (nuevaCantidad > item.stock_disponible) {
      this.mostrarMensaje(`Stock insuficiente (disponible: ${item.stock_disponible})`, 'warning');
      return;
    }
    item.cantidad = nuevaCantidad;
    item.subtotal = item.cantidad * item.precio_unitario;
    this.calcularTotales();
  }

  // ─── TOTALES ───────────────────────────────────────────────────────────────

  calcularTotales(): void {
    this.subtotal = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    this.descuento = Number(this.formVenta.get('descuento')?.value || 0);
    this.total = Math.max(0, this.subtotal - this.descuento);

    this.formVenta.patchValue({
      subtotal: this.subtotal,
      total: this.total
    }, { emitEvent: false });

    // Si es contado, actualizar el monto del pago
    if (this.formVenta.get('tipo_pago')?.value === 'contado' && this.pagos.length > 0) {
      this.pagos.at(0).patchValue({ monto: this.total }, { emitEvent: false });
    }
  }

  getTotalPagos(): number {
    return this.pagos.controls.reduce((sum, ctrl) => sum + Number(ctrl.value.monto || 0), 0);
  }

  // ─── SUBMIT ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    // Validaciones
    if (this.carrito.length === 0) {
      this.mostrarMensaje('Agregue al menos un producto al carrito', 'warning');
      return;
    }

    const tipoCliente = this.formVenta.get('tipo_cliente')?.value;
    const clienteId = this.formVenta.get('cliente_id')?.value;
    const clienteNombre = this.formVenta.get('cliente_nombre')?.value;

    if (tipoCliente === 'registrado' && !clienteId) {
      this.mostrarMensaje('Seleccione un cliente registrado', 'warning');
      return;
    }
    if (tipoCliente === 'ocasional' && !clienteNombre) {
      this.mostrarMensaje('Ingrese el nombre del cliente', 'warning');
      return;
    }

    const tipoPago = this.formVenta.get('tipo_pago')?.value;

    // Validar crédito solo para clientes registrados
    if (tipoPago === 'credito' && tipoCliente === 'ocasional') {
      this.mostrarMensaje('Las ventas a crédito requieren cliente registrado', 'warning');
      return;
    }

    // Validar pagos según tipo
    const totalPagos = this.getTotalPagos();
    if (tipoPago === 'contado' && totalPagos !== this.total) {
      this.mostrarMensaje('El pago debe ser igual al total en ventas de contado', 'warning');
      return;
    }
    if (tipoPago === 'mixto' && (totalPagos <= 0 || totalPagos >= this.total)) {
      this.mostrarMensaje('En ventas mixtas el pago inicial debe ser mayor a 0 y menor al total', 'warning');
      return;
    }

    // this.cargando = true;

    // Armar payload
    const venta = {
      // Cliente
      cliente_id: tipoCliente === 'registrado' ? clienteId : null,
      cliente_nombre: tipoCliente === 'ocasional' ? clienteNombre : null,
      cliente_telefono: this.formVenta.get('cliente_telefono')?.value || null,
      cliente_referencia: this.formVenta.get('cliente_referencia')?.value || null,

      // Totales
      subtotal: this.subtotal,
      descuento: this.descuento,
      total: this.total,
      tipo_pago: tipoPago,
      notas: this.formVenta.get('notas')?.value || null,

      // Detalles (productos)
      detalles: this.carrito.map(item => ({
        producto_id: item.producto_id,
        variante_id: item.variante_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        talla_vendida: item.talla,
        color_vendido: item.color,
        genero_vendido: item.genero
      })),

      // Pagos iniciales (si aplica)
      pagos: tipoPago !== 'credito' ? this.pagos.value : []
    };

    console.log('Venta a registrar:', venta);

    // ❗ DESCOMENTAR cuando tengas el servicio
    // this.VentasService.crearVenta(venta).subscribe({
    //   next: (response) => {
    //     this.mostrarMensaje('Venta registrada exitosamente', 'success');
    //     this.router.navigate(['component/ventas-diarias']);
    //     this.cargando = false;
    //   },
    //   error: (error) => {
    //     console.error('Error:', error);
    //     this.mostrarMensaje('Error al registrar la venta', 'error');
    //     this.cargando = false;
    //   }
    // });

    // Por ahora solo simulamos
    // setTimeout(() => {
    //   this.mostrarMensaje('Venta registrada (simulación)', 'success');
    //   this.cargando = false;
    //   // this.router.navigate(['component/ventas-diarias']);
    // }, 1000);
  }

  cancelar(): void {
    this.router.navigate(['component/ventas-diarias']);
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