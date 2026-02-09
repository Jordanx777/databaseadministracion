import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from 'src/app/@theme/services/auth.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  currentUser: User | null = null;

  // con una condicional ternaria si activo es true que diga activo, si no inactivo
  getStatusText(): string {
    return this.currentUser?.activo ? 'Activo' : 'Inactivo';
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('🔍 ProfileComponent - ngOnInit: Usuario actualizado',this.currentUser);
    });
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const nombre = this.currentUser.nombre?.charAt(0) || '';
    const apellido = this.currentUser.apellido?.charAt(0) || '';
    return (nombre + apellido).toUpperCase() || 'U';
  }
}