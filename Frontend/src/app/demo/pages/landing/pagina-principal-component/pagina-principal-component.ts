import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// --- Módulos de Angular Material ---
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
// Estos dos son VITALES para que funcione el menú móvil que pusimos en el HTML:
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-pagina-principal-component',
  standalone: true,
  imports: [
    CommonModule,
    // Registramos todos los módulos aquí
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSidenavModule, 
    MatListModule
  ],
  templateUrl: './pagina-principal-component.html',
  styleUrls: ['./pagina-principal-component.scss'] // Ojo: asegúrate que coincida el nombre
})
export class PaginaPrincipalComponent {

  // Esta variable controla si el menú lateral del móvil se ve o no.
  // En el HTML está enlazada con [(opened)]="isSidenavOpen"
  isSidenavOpen = false;

  constructor() {}

  // Opcional: Método para hacer scroll suave a las secciones
  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Cerramos el menú móvil si estaba abierto
      this.isSidenavOpen = false;
    }
  }
}