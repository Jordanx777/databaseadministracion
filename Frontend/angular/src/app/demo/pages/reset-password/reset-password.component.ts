// src/app/components/reset-password/reset-password.component.ts

import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/@theme/services/auth.service';

type Step = 'validating' | 'form' | 'invalid' | 'success';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {

  step: Step  = 'validating';
  token       = '';

  password        = '';
  confirmPassword = '';
  showPassword    = false;
  showConfirm     = false;

  isLoading = false;
  error     = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Leer token de la URL: /reset-password?token=abc123
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.step = 'invalid';
      this.cdr.markForCheck();
      return;
    }

    // Validar token con el backend antes de mostrar el formulario
    this.authService.validateResetToken(this.token)
      .subscribe({
        next: (res) => {
          this.step = res?.data?.valid ? 'form' : 'invalid';
          this.cdr.markForCheck();
        },
        error: () => {
          this.step = 'invalid';
          this.cdr.markForCheck();
        },
      });
  }

  get passwordStrength(): 'weak' | 'medium' | 'strong' | null {
    if (!this.password) return null;
    if (this.password.length < 6) return 'weak';
    const hasUpper   = /[A-Z]/.test(this.password);
    const hasNumber  = /\d/.test(this.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(this.password);
    const score      = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score >= 2 && this.password.length >= 8) return 'strong';
    return 'medium';
  }

  submit(): void {
    this.error = '';

    if (!this.password) {
      this.error = 'Ingresa tu nueva contraseña.'; return;
    }
    if (this.password.length < 6) {
      this.error = 'Mínimo 6 caracteres.'; return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden.'; return;
    }

    this.isLoading = true;

    this.authService.resetPassword(this.token, this.password, this.confirmPassword)
      .subscribe({
        next: (res) => {
          if (res?.type === 'success' || res?.success) {
            this.step = 'success';
          } else {
            this.error = res?.message ?? 'Error al restablecer la contraseña.';
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error     = err?.error?.message ?? 'El enlace es inválido o ha expirado.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}