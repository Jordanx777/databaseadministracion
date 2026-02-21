import { Navigation } from 'src/app/@theme/types/navigation';

export const menus: Navigation[] = [
  {
    id: 'navigation',
    title: 'Navigation',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'Dashboard',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard',
        icon: '#custom-status-up'
      }
    ]
  },

  
  
  {
    id: 'productos',
    title: 'Productos',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'productos',
        title: 'Stock de Productos',
        type: 'item',
        classes: 'nav-item',
        url: '/component/producto',
        icon: '#custom-box'
      },
      // Busca la sección de productos en tu archivo de menú y déjala así:
      {
        id: 'agregar-producto',
        title: 'Agregar Productos',
        type: 'item',
        classes: 'nav-item',
        url: '/component/addproducto', // URL corregida
        icon: '#custom-plus-circle'
      } , {
        id: 'catalogo',
        title: 'Catálogo de Productos',
        type: 'item',
        classes: 'nav-item',
        url: '/component/catalogo', // URL corregida
        icon: '#custom-list'
      }
    ]
  },
  {
    id: 'Proveedores',
    title: 'Proveedores',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'proveedores',
        title: 'Lista de Proveedores',
        type: 'item',
        classes: 'nav-item',
        url: '/component/proveedor',
        icon: '#custom-people'
      },
      {
        id: 'agregar-proveedor',
        title: 'Agregar Proveedores',
        type: 'item',
        classes: 'nav-item',
        url: '/component/addproveedor',
        icon: '#custom-user-plus'
      }
    ]
  },

  {
    id: 'ventas',
    title: 'Ventas',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'agregar-venta',
        title: 'Agregar Ventas',
        type: 'item',
        classes: 'nav-item',
        url: '/component/addventas',
        icon: '#custom-cart'
      },{
        id: 'ventas-diarias',
        title: 'Ventas Diarias',
        type: 'item',
        classes: 'nav-item',
        url: '/component/ventas-diarias',
        icon: '#custom-chart-bar'
      }
    ]
  },

  {
    id: 'pagos',
    title: 'Pagos',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'pagos-pendientes',
        title: 'Pagos Pendientes',
        type: 'item',
        classes: 'nav-item',
        url: '/component/pagos-pendientes',
        icon: '#custom-wallet'
      }, 
      {
        id: 'agregar-deudores',
        title: 'Agregar Deudores',
        type: 'item',
        classes: 'nav-item',
        url: '/component/adddeudores',
        icon: '#custom-user-plus'
      }
    ]
  },
  
  
 
];
