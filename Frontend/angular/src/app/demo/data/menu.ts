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
  
  {
    id: 'auth',
    title: 'Authentication',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      // {
      //   id: 'Login',
      //   title: 'Login',
      //   type: 'item',
      //   classes: 'nav-item',
      //   url: '/auth/login',
      //   icon: '#custom-shield',
      //   target: true,
      //   breadcrumbs: false
      // },
      {
        id: 'register',
        title: 'Register',
        type: 'item',
        classes: 'nav-item',
        url: '/auth/register',
        icon: '#custom-password-check',
        target: true,
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'ui-component',
    title: 'Ui Component',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'typography',
        title: 'Typography',
        type: 'item',
        classes: 'nav-item',
        url: '/component/typography',
        icon: '#custom-text-block'
      },
      {
        id: 'color',
        title: 'Color',
        type: 'item',
        classes: 'nav-item',
        url: '/component/color',
        icon: '#custom-clipboard'
      },
      {
        id: 'table',
        title: 'Tabler',
        type: 'item',
        classes: 'nav-item',
        url: 'https://tabler-icons.io/',
        icon: '#custom-mouse-circle',
        target: true,
        external: true
      }
    ]
  },
  {
    id: 'other',
    title: 'Other',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'menu-levels',
        title: 'Menu levels',
        type: 'collapse',
        icon: '#custom-level',
        children: [
          {
            id: 'level-2-1',
            title: 'Level 2.1',
            type: 'item',
            url: 'javascript:'
          },
          {
            id: 'menu-level-2.2',
            title: 'Menu Level 2.2',
            type: 'collapse',
            classes: 'edge',
            children: [
              {
                id: 'menu-level-3.1',
                title: 'Menu Level 3.1',
                type: 'item',
                url: 'javascript:'
              },
              {
                id: 'menu-level-3.2',
                title: 'Menu Level 3.2',
                type: 'item',
                url: 'javascript:'
              },
              {
                id: 'menu-level-3.3',
                title: 'Menu Level 3.3',
                type: 'collapse',
                classes: 'edge',
                children: [
                  {
                    id: 'menu-level-4.1',
                    title: 'Menu Level 4.1',
                    type: 'item',
                    url: 'javascript:'
                  },
                  {
                    id: 'menu-level-4.2',
                    title: 'Menu Level 4.2',
                    type: 'item',
                    url: 'javascript:'
                  }
                ]
              }
            ]
          },
          {
            id: 'menu-level-2.3',
            title: 'Menu Level 2.3',
            type: 'collapse',
            classes: 'edge',
            children: [
              {
                id: 'menu-level-3.1',
                title: 'Menu Level 3.1',
                type: 'item',
                url: 'javascript:'
              },
              {
                id: 'menu-level-3.2',
                title: 'Menu Level 3.2',
                type: 'item',
                url: 'javascript:'
              },
              {
                id: 'menu-level-3.3',
                title: 'Menu Level 3.3',
                type: 'collapse',
                classes: 'edge',
                children: [
                  {
                    id: 'menu-level-4.1',
                    title: 'Menu Level 4.1',
                    type: 'item',
                    url: 'javascript:'
                  },
                  {
                    id: 'menu-level-4.2',
                    title: 'Menu Level 4.2',
                    type: 'item',
                    url: 'javascript:'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'sample-page',
        title: 'Sample Page',
        type: 'item',
        classes: 'nav-item',
        url: '/sample-page',
        icon: '#custom-notification-status'
      }
    ]
  }
];
