import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-catalogo-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo-component.html',
  styleUrl: './catalogo-component.scss',
})
export class CatalogoComponent {

  productos = [
    {
      nombre: 'Camiseta Oversize',
      descripcion: 'Algodón premium · Corte moderno',
      precio: 90000,
      badge: 'NEW',
      color: '#a78bfa'
    },
    {
      nombre: 'Pantalón Cargo',
      descripcion: 'Streetwear · Bolsillos amplios',
      precio: 120000,
      badge: 'HOT',
      color: '#fb7185'
    },
    {
      nombre: 'Hoodie Premium',
      descripcion: 'Tela gruesa · Alta durabilidad',
      precio: 150000,
      badge: 'SALE',
      color: '#22c55e'
    },
    {
      nombre: 'Gorra Urbana',
      descripcion: 'Ajustable · Diseño minimal',
      precio: 45000,
      badge: 'NEW',
      color: '#38bdf8'
    }
  ];

  agregarAlCarrito(producto: any): void {
    // aquí luego conectas carrito real
  }
}
