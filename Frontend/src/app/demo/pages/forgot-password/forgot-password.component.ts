// src/app/components/forgot-password/forgot-password.component.ts

import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/@theme/services/auth.service';

type Step = 'form' | 'sent' | 'dev';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {

  correo    = '';
  step: Step  = 'form';
  isLoading   = false;
  error       = '';

  // Se llenan solo en dev mode
  devToken    = '';
  devResetUrl = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  submit(): void {
    this.error = '';

    if (!this.correo.trim()) {
      this.error = 'Ingresa tu correo electrónico.'; return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.correo)) {
      this.error = 'El correo no tiene un formato válido.'; return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(this.correo.trim())
      .subscribe({
        next: (res) => {
          this.isLoading = false;

          // Si el backend está en devMode devuelve data.debug con el token
          if (res?.data?.debug) {
            this.devToken    = res.data.debug.token;
            this.devResetUrl = res.data.debug.reset_url;
            this.step        = 'dev';
          } else {
            this.step = 'sent';
          }
          this.cdr.markForCheck();
        },
        error: () => {
          // Aunque falle, mostramos "enviado" para no dar pistas
          this.step      = 'sent';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  goToResetUrl(): void {
    // Navega directamente al componente de reset con el token
    this.router.navigateByUrl(
      `/reset-password?token=${this.devToken}`
    );
  }

  copyToken(): void {
    navigator.clipboard.writeText(this.devToken);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}