import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/* aca van las rutas */

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../landing/pagina-principal-component/pagina-principal-component')
        .then(m => m.PaginaPrincipalComponent),
  },

  {
    path: '',
    children: [

      {
        path: 'typography',
        loadComponent: () =>
          import('./typography/typography.component')
      },

      /* rutas de forms */
      
      {
        path: 'addproducto',
        loadComponent: () =>
          import('../forms/agregar-productos-component/agregar-productos.component')
            .then(m => m.AgregarProductosComponent),
      },
      {
        path: 'registrar-pago',
        loadComponent: () =>
          import('../forms/registrar-pago-component/registrar-pago-component')
            .then(m => m.RegistrarPagoComponent),
      },
      {
        // ✅ Ruta de EDICIÓN — mismo componente, recibe el id
        path: 'addproducto/:id',
        loadComponent: () =>
          import('../forms/agregar-productos-component/agregar-productos.component')
            .then(m => m.AgregarProductosComponent),
      },

      {
        path: 'addproveedor',
        loadComponent: () =>
          import('../forms/agregar-proveedores-component/agregar-proveedores-component')
            .then(m => m.AgregarProveedoresComponent),
      },

      {
        path: 'addventas',
        loadComponent: () =>
          import('../forms/agregar-ventas-component/agregar-ventas-component')
            .then(m => m.AgregarVentasComponent),
      },

      // {
      //   path: 'adddeudores',
      //   loadComponent: () =>
      //     import('../forms/agregar-clientes-saldo-component/agregar-clientes-saldo-component')
      //       .then(m => m.AgregarClientesSaldoComponent),
      // },

      /* rutas de pages */
      {
        path: 'Usuarios',
        loadComponent: () =>
          import('./usuarios.component/usuarios.component')
            .then(m => m.UsuariosComponent)
      },
      {
        path: 'producto',
        loadComponent: () =>
          import('./productos-component/productos-component')
            .then(m => m.ProductosComponent)
      },
      {
        path: 'Roles',
        loadComponent: () =>
          import('./roles.component/roles.component')
            .then(m => m.RolesComponent)
      },
      {
        path: 'marcas',
        loadComponent: ()=>
          import('./marcas-component/marcas.component')
        .then(m => m.MarcasComponent)
      },
      {
        path: 'Categorias&Subcategorias',
        loadComponent: () =>
          import('./categorias-subcategorias/categorias-subcategorias')
            .then(m => m.CategoriasGestionComponent)
      },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./catalogo-component/catalogo-component')
            .then(m => m.CatalogoComponent)
      },
      {
        path: 'cuentas/:id',
        loadComponent: () =>
          import('./cuentas-cliente/cuentas-cliente-component')
            .then(m => m.CuentasClienteComponent),
      },
      {
        path: 'cuentas-cobrar',
        loadComponent: () =>
          import('./cuentas-cobrar-component/cuentas-cobrar-component')
            .then(m => m.CuentasCobrarComponent),
      },
      {
        path: 'cuentas-detalles/:id',
        loadComponent: () =>
          import('./cuenta-detail/cuenta-detail.component')
            .then(m => m.CuentaDetailComponent),
      },
      
      {
        path: 'Clientes',
        loadComponent: ()=>
          import('./clientes-component/clientes.component')
        .then(m=> m.ClientesComponent)
      },

      {
        path: 'proveedor',
        loadComponent: () =>
          import('./proveedores-component/proveedores-component')
            .then(m => m.ProveedoresComponent)
      },

      {
        path: 'ventas',
        loadComponent: () =>
          import('./ventas-list-component/ventas-list-component')
            .then(m => m.VentasListComponent)
      },

      {
        path: 'color',
        loadComponent: () =>
          import('./color/color.component')
      },
      {
        path: 'HistorialVentas',
        loadComponent: () =>
          import('./historial-ventas-component/historial-ventas-component')
            .then(m => m.HistorialVentasComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComponentRoutingModule {}
