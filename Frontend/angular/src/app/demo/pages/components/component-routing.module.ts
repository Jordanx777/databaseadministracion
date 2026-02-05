import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


/*aca van las rutas */

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'typography',
        loadComponent: () => import('./typography/typography.component')
      },


      /*rutas de forms */

        {
        path: 'addproducto',
        loadComponent: () =>
          import('../forms/agregar-productoscomponent/agregar-productoscomponent')
            .then(m => m.AgregarProductoscomponent),
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

      /*-- -- -- -- -- -- */

      /*rutas de pages */

      {
        path: 'producto',
       loadComponent: () =>
  import('./productos-component/productos-component')
    .then(m => m.ProductosComponent)

      },

      {
        path: 'proveedor',
       loadComponent: () =>
  import('./proveedores-component/proveedores-component')
    .then(m => m.ProveedoresComponent)
      },

      /*-- -- -- -- -- -- -- */

      {
        path: 'color',
        loadComponent: () => import('./color/color.component')
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComponentRoutingModule {}
