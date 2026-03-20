import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

/* Angular Material */
import { MatCardModule }              from '@angular/material/card';
import { MatFormFieldModule }         from '@angular/material/form-field';
import { MatInputModule }             from '@angular/material/input';
import { MatSelectModule }            from '@angular/material/select';
import { MatButtonModule }            from '@angular/material/button';
import { MatIconModule }              from '@angular/material/icon';
import { MatProgressSpinnerModule }   from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule }           from '@angular/material/tooltip';
import { MatDividerModule }           from '@angular/material/divider';
import { MatRadioModule }             from '@angular/material/radio';
import { MatCheckboxModule }          from '@angular/material/checkbox';
import { MatAutocompleteModule }      from '@angular/material/autocomplete';
import { MatTableModule }             from '@angular/material/table';
import { MatChipsModule }             from '@angular/material/chips';

/* Servicios */
import { ProductosService }           from 'src/app/@theme/services/Productos.service';
import { ClientesService }            from 'src/app/@theme/services/Cliente.service';
import { VentasService, VentaCrear }  from 'src/app/@theme/services/Ventas.services';
import { AuthService }                from 'src/app/@theme/services/auth.service';
import { ApiService }                 from 'src/app/@theme/services/api.service';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

interface ItemCarrito {
  producto_id:      number;
  variante_id:      number;
  producto_nombre:  string;
  marca_nombre:     string;
  talla:            string;
  color:            string;
  genero:           string;
  cantidad:         number;
  precio_unitario:  number;
  stock_disponible: number;
  subtotal:         number;
}

interface CreditoInfo {
  limite:     number;
  deuda:      number;
  disponible: number;
}

@Component({
  selector: 'app-agregar-ventas',
  standalone: true,
  templateUrl: './agregar-ventas-component.html',
  styleUrls: ['./agregar-ventas-component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatDividerModule, MatRadioModule, MatCheckboxModule,
    MatAutocompleteModule, MatTableModule, MatChipsModule,
  ]
})
export class AgregarVentasComponent implements OnInit {

  formVenta!: FormGroup;

  clientes:          any[] = [];
  clientesFiltrados!: Observable<any[]>;
  productos:          any[] = [];
  productosFiltrados!: Observable<any[]>;

  tiposCliente = [
    { value: 'registrado', label: 'Cliente registrado'               },
    { value: 'ocasional',  label: 'Cliente ocasional (sin registro)' },
  ];

  tiposPago = [
    { value: 'contado', label: 'Contado (100% inmediato)' },
    { value: 'credito', label: 'Crédito (pago posterior)' },
    { value: 'mixto',   label: 'Mixto (abono + saldo)'   },
  ];

  metodosPago = [
    { value: 'efectivo',      label: 'Efectivo'      },
    { value: 'nequi',         label: 'Nequi'         },
    { value: 'daviplata',     label: 'Daviplata'     },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'tarjeta',       label: 'Tarjeta'       },
  ];

  carrito:         ItemCarrito[] = [];
  columnasCarrito = ['producto', 'variante', 'cantidad', 'precio_unitario', 'subtotal', 'acciones'];

  subtotal  = 0;
  descuento = 0;
  total     = 0;

  // ── Crédito ───────────────────────────────────────────
  creditoInfo: CreditoInfo | null = null;
  cargandoCredito = false;

  get creditoInsuficiente(): boolean {
    if (!this.creditoInfo) return false;
    const tipo = this.formVenta?.get('tipo_pago')?.value;
    if (tipo === 'credito') return this.total > this.creditoInfo.disponible;
    if (tipo === 'mixto') {
      const saldo = this.total - this.getTotalPagos();
      return saldo > 0 && saldo > this.creditoInfo.disponible;
    }
    return false;
  }

  get montoCredito(): number {
    const tipo = this.formVenta?.get('tipo_pago')?.value;
    if (tipo === 'credito') return this.total;
    if (tipo === 'mixto')   return Math.max(0, this.total - this.getTotalPagos());
    return 0;
  }

  cargando      = false;
  cargandoDatos = true;

  constructor(
    private fb:              FormBuilder,
    private productosService: ProductosService,
    private clientesService:  ClientesService,
    private ventasService:    VentasService,
    private authService:      AuthService,
    private apiService:       ApiService,
    private router:           Router,
    private snackBar:         MatSnackBar,
    private cdr:              ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.crearFormulario();
    this.cargarDatosIniciales();
    this.configurarAutocompletes();
  }

  crearFormulario(): void {
    this.formVenta = this.fb.group({
      tipo_cliente:         ['registrado', Validators.required],
      cliente_id:           [''],
      cliente_nombre:       [''],
      cliente_telefono:     [''],
      cliente_referencia:   [''],
      producto_busqueda:    [''],
      variante_seleccionada:[''],
      cantidad_agregar:     [1, [Validators.min(1)]],
      subtotal:             [0],
      descuento:            [0],
      total:                [0],
      tipo_pago:            ['contado', Validators.required],
      notas:                [''],
      pagos:                this.fb.array([]),
    });

    // Validaciones dinámicas según tipo_cliente
    this.formVenta.get('tipo_cliente')?.valueChanges.subscribe(tipo => {
      const clienteIdCtrl = this.formVenta.get('cliente_id');
      const nombreCtrl    = this.formVenta.get('cliente_nombre');
      if (tipo === 'registrado') {
        clienteIdCtrl?.setValidators([Validators.required]);
        nombreCtrl?.clearValidators();

        // limpiar nombre ocasional
        nombreCtrl?.setValue('');
      } else {

          clienteIdCtrl?.clearValidators();
          nombreCtrl?.setValidators([Validators.required]);

          // 👇 nombre por defecto
          if (!nombreCtrl?.value) {
            nombreCtrl?.setValue('Cliente ocasional');
          }
        }
        clienteIdCtrl?.updateValueAndValidity();
        nombreCtrl?.updateValueAndValidity();
    });

    /* ───────── CAMBIOS SEGÚN TIPO DE PAGO ───────── */

  this.formVenta.get('tipo_pago')?.valueChanges.subscribe(tipo => {

    if (tipo === 'contado') {

      this.pagos.clear();
      this.agregarPago();

      if (this.pagos.length > 0) {
        this.pagos.at(0).patchValue({ monto: this.total });
      }

    }

    else if (tipo === 'mixto') {

      if (this.pagos.length === 0) {
        this.agregarPago();
      }

    }

    else {

      // crédito puro
      this.pagos.clear();
    }

    // actualizar estado del crédito
    this.actualizarCreditoSiAplica();

  });


  /* ───────── CAMBIO DE DESCUENTO ───────── */

  this.formVenta.get('descuento')?.valueChanges.subscribe(() => {
    this.calcularTotales();
  });


  /* ───────── ESTADO INICIAL DEL FORMULARIO ───────── */

  const tipoPagoInicial = this.formVenta.get('tipo_pago')?.value;

  if (tipoPagoInicial === 'contado') {

    this.pagos.clear();
    this.agregarPago();

    if (this.pagos.length > 0) {
      this.pagos.at(0).patchValue({ monto: this.total });
    }

  }

    // Pagos según tipo_pago
    // this.formVenta.get('tipo_pago')?.valueChanges.subscribe(tipo => {
    //   if (tipo === 'contado') {
    //     this.pagos.clear();
    //     this.agregarPago();
    //     this.pagos.at(0).patchValue({ monto: this.total });
    //   } else if (tipo === 'mixto') {
    //     if (this.pagos.length === 0) this.agregarPago();
    //   } else {
    //     // crédito: sin pagos inmediatos
    //     this.pagos.clear();
    //   }
    //   // Recalcular estado del crédito al cambiar tipo de pago
    //   this.actualizarCreditoSiAplica();
    // });

    // // ejecutar lógica inicial de tipo_pago
    // setTimeout(() => {
    //   const tipoPago = this.formVenta.get('tipo_pago')?.value;

    //   if (tipoPago === 'contado') {
    //     this.pagos.clear();
    //     this.agregarPago();
    //     this.pagos.at(0).patchValue({ monto: this.total });
    //   }
    // });

    // this.formVenta.get('descuento')?.valueChanges.subscribe(() => this.calcularTotales());


  }

  // ── Autocomplete: cuando selecciona un cliente, cargar crédito
  onClienteSeleccionado(cliente: any): void {
    if (!cliente?.id) { this.creditoInfo = null; return; }
    const tipo = this.formVenta.get('tipo_pago')?.value;
    if (tipo === 'credito' || tipo === 'mixto') {
      this.cargarCreditoCliente(cliente.id);
    }
  }

  private actualizarCreditoSiAplica(): void {
    const tipo    = this.formVenta.get('tipo_pago')?.value;
    const cliente = this.formVenta.get('cliente_id')?.value;
    if ((tipo === 'credito' || tipo === 'mixto') && cliente?.id) {
      this.cargarCreditoCliente(cliente.id);
    } else {
      this.creditoInfo = null;
    }
  }

  private cargarCreditoCliente(clienteId: number): void {
    this.cargandoCredito = true;
    this.apiService.get<any>(`clientes/credito/${clienteId}`).subscribe({
      next: (res) => {
        this.creditoInfo    = res?.data ?? null;
        this.cargandoCredito = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.creditoInfo    = null;
        this.cargandoCredito = false;
        this.cdr.detectChanges();
      },
    });
  }

  get pagos(): FormArray {
    return this.formVenta.get('pagos') as FormArray;
  }

  crearPago(): FormGroup {
    return this.fb.group({
      monto:      [0,          [Validators.required, Validators.min(0.01)]],
      metodo_pago:['efectivo', Validators.required],
      referencia: [''],
      notas:      [''],
    });
  }

  agregarPago():            void { this.pagos.push(this.crearPago()); }
  eliminarPago(i: number):  void { this.pagos.removeAt(i); }

  cargarDatosIniciales(): void {
    this.cargandoDatos = true;
    Promise.all([
      this.clientesService.getAll().toPromise(),
      this.productosService.getProductos().toPromise(),
    ])
    .then(([clientesRes, productosRes]) => {
      this.clientes  = this.extraerDatos(clientesRes);
      this.productos = this.extraerDatos(productosRes);
      setTimeout(() => {
        this.cargandoDatos = false;
        this.cdr.detectChanges();
      });
    })
    .catch(err => {
      console.error('Error cargando datos:', err);
      this.mostrarMensaje('Error al cargar datos del formulario', 'error');
      this.cargandoDatos = false;
      this.cdr.detectChanges();
    });
  }

  private extraerDatos(response: any): any[] {
    if (response?.data) return Array.isArray(response.data) ? response.data : [];
    if (Array.isArray(response)) return response;
    return [];
  }

  configurarAutocompletes(): void {
    this.clientesFiltrados = this.formVenta.get('cliente_id')!.valueChanges.pipe(
      startWith(''),
      map(v => this._filtrarClientes(v || ''))
    );
    this.productosFiltrados = this.formVenta.get('producto_busqueda')!.valueChanges.pipe(
      startWith(''),
      map(v => this._filtrarProductos(v || ''))
    );
  }

  private _filtrarClientes(value: any): any[] {
    if (typeof value !== 'string') return this.clientes;
    const f = value.toLowerCase();
    return this.clientes.filter(c =>
      c.nombre?.toLowerCase().includes(f) ||
      c.apodo?.toLowerCase().includes(f)  ||
      c.telefono?.includes(f)
    );
  }

  private _filtrarProductos(value: any): any[] {
    if (typeof value !== 'string') return this.productos;
    const f = value.toLowerCase();
    return this.productos.filter(p =>
      p.nombre?.toLowerCase().includes(f) ||
      p.marca_nombre?.toLowerCase().includes(f)
    );
  }

  displayCliente(cliente: any): string {
    if (!cliente) return '';
    return `${cliente.nombre}${cliente.apodo ? ' (' + cliente.apodo + ')' : ''}`;
  }

  // ✅ Fix: no mostrar "null" cuando no hay marca
  displayProducto(producto: any): string {
    if (!producto) return '';
    const marca = producto.marca_nombre ? ` - ${producto.marca_nombre}` : '';
    return `${producto.nombre}${marca}`;
  }

  agregarAlCarrito(): void {
    const productoSeleccionado = this.formVenta.get('producto_busqueda')?.value;
    const varianteId           = this.formVenta.get('variante_seleccionada')?.value;
    const cantidad             = this.formVenta.get('cantidad_agregar')?.value;

    if (!productoSeleccionado || !varianteId || cantidad < 1) {
      this.mostrarMensaje('Seleccione producto, variante y cantidad', 'warning');
      return;
    }

    const variante = productoSeleccionado.variantes?.find((v: any) => v.id === varianteId);
    if (!variante) { this.mostrarMensaje('Variante no encontrada', 'error'); return; }
    if (cantidad > variante.stock) {
      this.mostrarMensaje(`Stock insuficiente (disponible: ${variante.stock})`, 'warning');
      return;
    }

    const existe = this.carrito.find(
      item => item.producto_id === productoSeleccionado.id && item.variante_id === varianteId
    );

    if (existe) {
      const nuevaCantidad = existe.cantidad + cantidad;
      if (nuevaCantidad > variante.stock) {
        this.mostrarMensaje(`Stock insuficiente (disponible: ${variante.stock})`, 'warning');
        return;
      }
      existe.cantidad = nuevaCantidad;
      existe.subtotal = existe.cantidad * existe.precio_unitario;
    } else {
      this.carrito.push({
        producto_id:      productoSeleccionado.id,
        variante_id:      varianteId,
        producto_nombre:  productoSeleccionado.nombre,
        marca_nombre:     productoSeleccionado.marca_nombre || '',
        talla:            variante.talla,
        color:            variante.color,
        genero:           variante.genero,
        cantidad,
        precio_unitario:  productoSeleccionado.precio_venta,
        stock_disponible: variante.stock,
        subtotal:         cantidad * productoSeleccionado.precio_venta,
      });
    }

    this.formVenta.patchValue({
      producto_busqueda:     '',
      variante_seleccionada: '',
      cantidad_agregar:      1,
    });

    this.calcularTotales();
  }

  eliminarDelCarrito(i: number): void {
    this.carrito.splice(i, 1);
    this.calcularTotales();
  }

  actualizarCantidad(item: ItemCarrito, nuevaCantidad: number): void {
    if (nuevaCantidad < 1) {
      this.mostrarMensaje('La cantidad debe ser al menos 1', 'warning'); return;
    }
    if (nuevaCantidad > item.stock_disponible) {
      this.mostrarMensaje(`Stock insuficiente (disponible: ${item.stock_disponible})`, 'warning'); return;
    }
    item.cantidad = nuevaCantidad;
    item.subtotal = item.cantidad * item.precio_unitario;
    this.calcularTotales();
  }

  calcularTotales(): void {
    this.subtotal  = this.carrito.reduce((s, i) => s + i.subtotal, 0);
    this.descuento = Number(this.formVenta.get('descuento')?.value || 0);
    this.total     = Math.max(0, this.subtotal - this.descuento);

    this.formVenta.patchValue(
      { subtotal: this.subtotal, total: this.total },
      { emitEvent: false }
    );

    if (this.formVenta.get('tipo_pago')?.value === 'contado' && this.pagos.length > 0) {
      this.pagos.at(0).patchValue({ monto: this.total }, { emitEvent: false });
    }
  }

  getTotalPagos(): number {
    return this.pagos.controls.reduce((s, c) => s + Number(c.value.monto || 0), 0);
  }

  onSubmit(): void {
    if (this.carrito.length === 0) {
      this.mostrarMensaje('Agregue al menos un producto al carrito', 'warning'); return;
    }

    const tipoCliente  = this.formVenta.get('tipo_cliente')?.value;
    const clienteId    = this.formVenta.get('cliente_id')?.value;
    const clienteNombre= this.formVenta.get('cliente_nombre')?.value;
    const tipoPago     = this.formVenta.get('tipo_pago')?.value;

    if (tipoCliente === 'registrado' && !clienteId) {
      this.mostrarMensaje('Seleccione un cliente registrado', 'warning'); return;
    }
    if (tipoCliente === 'ocasional' && !clienteNombre) {
      this.mostrarMensaje('Ingrese el nombre del cliente', 'warning'); return;
    }
    if (tipoPago === 'credito' && tipoCliente === 'ocasional') {
      this.mostrarMensaje('Las ventas a crédito requieren cliente registrado', 'warning'); return;
    }
    if (tipoPago === 'mixto' && tipoCliente === 'ocasional') {
      this.mostrarMensaje('Los clientes ocasionales no pueden hacer pagos mixtos', 'warning'); return;
    }

    // Bloquear si crédito insuficiente (doble validación en frontend)
    if (this.creditoInsuficiente) {
      this.mostrarMensaje(
        `Crédito insuficiente. Disponible: $${this.creditoInfo!.disponible.toLocaleString('es-CO')}`,
        'error'
      );
      return;
    }

    const totalPagos = this.getTotalPagos();
    if (tipoPago === 'contado' && totalPagos !== this.total) {
      this.mostrarMensaje('El pago debe ser igual al total en ventas de contado', 'warning'); return;
    }
    if (tipoPago === 'mixto' && (totalPagos <= 0 || totalPagos >= this.total)) {
      this.mostrarMensaje('En ventas mixtas el pago inicial debe ser mayor a 0 y menor al total', 'warning'); return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.mostrarMensaje('Sesión no válida. Inicie sesión nuevamente.', 'error'); return;
    }

    this.cargando = true;

    // Validar stock justo antes de enviar
    for (const detalle of this.carrito) {
      const producto = this.productos.find(p => p.id === detalle.producto_id);
      const variante = producto?.variantes?.find((v: any) => v.id === detalle.variante_id);
      if (!variante) {
        this.mostrarMensaje(`Variante no encontrada para ${detalle.producto_nombre}`, 'error');
        this.cargando = false; return;
      }
      if (detalle.cantidad > variante.stock) {
        this.mostrarMensaje(
          `Stock insuficiente para ${detalle.producto_nombre} ${detalle.talla}/${detalle.color} (disponible: ${variante.stock})`,
          'error'
        );
        this.cargando = false; return;
      }
    }

    const venta: VentaCrear = {
      usuario_id:         currentUser.id_usuario,
      cliente_id:         tipoCliente === 'registrado' ? (clienteId?.id || clienteId) : null,
      cliente_nombre:     tipoCliente === 'ocasional'  ? clienteNombre : null,
      cliente_telefono:   this.formVenta.get('cliente_telefono')?.value  || null,
      cliente_referencia: this.formVenta.get('cliente_referencia')?.value || null,
      subtotal:           this.subtotal,
      descuento:          this.descuento,
      total:              this.total,
      tipo_pago:          tipoPago,
      notas:              this.formVenta.get('notas')?.value || null,
      detalles:           this.carrito.map(item => ({
        producto_id:    item.producto_id,
        variante_id:    item.variante_id,
        cantidad:       item.cantidad,
        precio_unitario:item.precio_unitario,
        subtotal:       item.subtotal,
        talla_vendida:  item.talla,
        color_vendido:  item.color,
        genero_vendido: item.genero,
      })),
      pagos: tipoPago !== 'credito' ? this.pagos.value : [],
    };

    this.ventasService.crearVenta(venta).subscribe({
      next: () => {
        this.mostrarMensaje('Venta registrada exitosamente', 'success');
        this.router.navigate(['component/ventas']);
        this.cargando = false;
      },
      error: (error) => {
        const msg = error?.error?.message ?? 'Error al registrar la venta';
        this.mostrarMensaje(msg, 'error');
        this.cargando = false;
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['component/ventas']);
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`],
    });
  }
}