// Angular import
import { Component, inject, input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// project import
import { NavigationItem } from 'src/app/@theme/types/navigation';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MenuItemComponent } from './menu-item/menu-item.component';
import { MenuCollapseComponent } from './menu-collapse/menu-collapse.component';
import { MenuGroupVerticalComponent } from './menu-group/menu-group.component';
import { AuthService, User } from 'src/app/@theme/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vertical-menu',
  imports: [SharedModule, MenuItemComponent, MenuCollapseComponent, MenuGroupVerticalComponent, CommonModule],
  templateUrl: './vertical-menu.component.html',
  styleUrls: ['./vertical-menu.component.scss']
})
export class VerticalMenuComponent implements OnInit, OnDestroy {
  private location           = inject(Location);
  private locationStrategy   = inject(LocationStrategy);
  private authService        = inject(AuthService);
  private router             = inject(Router);
  private cdr                = inject(ChangeDetectorRef); //  Necesario para evitar NG0100

  // public props
  menus = input.required<NavigationItem[]>();
  currentUser: User | null = null;

  private destroy$ = new Subject<void>();

  ngOnInit() {
    //  Se suscribe a los cambios del usuario y fuerza detección de cambios
    // Esto evita el error NG0100 (ExpressionChangedAfterItHasBeenCheckedError)
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.cdr.detectChanges(); //  Notificar a Angular del cambio asíncrono
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Obtener iniciales del usuario
  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const nombre   = this.currentUser.nombre?.charAt(0)   || '';
    const apellido = this.currentUser.apellido?.charAt(0) || '';
    return (nombre + apellido).toUpperCase() || 'U';
  }

  // Obtener nombre completo
  getFullName(): string {
    if (!this.currentUser) return 'Usuario';
    return `${this.currentUser.nombre || ''} ${this.currentUser.apellido || ''}`.trim() || 'Usuario';
  }

  // Obtener rol
  getUserRole(): string {
    return this.currentUser?.rol_nombre || 'Usuario';
  }

  // Manejar acciones del menú de cuenta
  handleAccountAction(action: string) {
    switch (action) {
      case 'profile':  this.router.navigate(['/profile']);      break;
      case 'settings': this.router.navigate(['/settings']);     break;
      case 'lock':     this.router.navigate(['/lock-screen']);  break;
      case 'logout':   this.logout();                           break;
    }
  }

  // Cerrar sesión
  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        this.router.navigate(['/auth/login']);
      }
    });
  }

  // public method
  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele  = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent      = ele.parentElement;
      const up_parent   = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
  }

  accountList = [
    { icon: 'ti ti-user',     title: 'My Perfil',      action: 'profile'  },
    { icon: 'ti ti-settings', title: 'Configuracion',  action: 'settings' },
    { icon: 'ti ti-lock',     title: 'Lock Screen',    action: 'lock'     },
    { icon: 'ti ti-power',    title: 'Cerrar Sesion',  action: 'logout'   }
  ];
}