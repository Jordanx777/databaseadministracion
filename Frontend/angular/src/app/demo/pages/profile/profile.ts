import {
  Component, inject, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService, User } from 'src/app/@theme/services/auth.service';
import { SharedModule } from '../../shared/shared.module';

type Section = 'info' | 'password';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);
  private destroy$    = new Subject<void>();

  currentUser: User | null = null;
  activeSection: Section   = 'info';

  // ── Cambio de contraseña ──────────────────────────────
  passwordForm = {
    password_actual:     '',
    password_nuevo:      '',
    confirmar_password:  '',
  };

  showActual  = false;
  showNuevo   = false;
  showConfirm = false;

  isSaving    = false;
  passwordError   = '';
  passwordSuccess = '';

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Helpers ───────────────────────────────────────────
  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const n = this.currentUser.nombre?.charAt(0)  || '';
    const a = this.currentUser.apellido?.charAt(0) || '';
    return (n + a).toUpperCase() || 'U';
  }

  getStatusText(): string {
    return this.currentUser?.activo ? 'Activo' : 'Inactivo';
  }

  setSection(s: Section): void {
    this.activeSection   = s;
    this.passwordError   = '';
    this.passwordSuccess = '';
    this.resetPasswordForm();
  }

  // ── Fortaleza de contraseña ───────────────────────────
  get passwordStrength(): 'weak' | 'medium' | 'strong' | null {
    const p = this.passwordForm.password_nuevo;
    if (!p) return null;
    if (p.length < 6) return 'weak';
    const score = [/[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)]
      .filter(Boolean).length;
    if (score >= 2 && p.length >= 8) return 'strong';
    return 'medium';
  }

  get strengthLabel(): string {
    return { weak: 'Débil', medium: 'Media', strong: 'Fuerte' }[this.passwordStrength ?? 'weak'] ?? '';
  }

  get passwordsMatch(): boolean | null {
    if (!this.passwordForm.confirmar_password) return null;
    return this.passwordForm.password_nuevo === this.passwordForm.confirmar_password;
  }

  // ── Cambiar contraseña ────────────────────────────────
  changePassword(): void {
    this.passwordError   = '';
    this.passwordSuccess = '';

    const { password_actual, password_nuevo, confirmar_password } = this.passwordForm;

    if (!password_actual)             { this.passwordError = 'Ingresa tu contraseña actual.'; return; }
    if (!password_nuevo)              { this.passwordError = 'Ingresa la nueva contraseña.'; return; }
    if (password_nuevo.length < 6)    { this.passwordError = 'Mínimo 6 caracteres.'; return; }
    if (password_nuevo !== confirmar_password) { this.passwordError = 'Las contraseñas no coinciden.'; return; }
    if (password_actual === password_nuevo)    { this.passwordError = 'La nueva contraseña debe ser diferente.'; return; }

    this.isSaving = true;

    this.authService.changePassword(password_actual, password_nuevo, confirmar_password)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: (res) => {
          if (res?.type === 'success' || res?.status === 'success') {
            console.log("RESPUESTA 1 :",res);
            this.passwordSuccess = '✓ Contraseña actualizada correctamente.';
            this.resetPasswordForm();
            // Limpiar mensaje de éxito después de 4 segundos
            this.toastTimer = setTimeout(() => {
              this.passwordSuccess = '';
              this.cdr.markForCheck();
            }, 4000);
          } else if(res?.type != 'success'){
               this.passwordError = res?.message ?? 'Error al actualizar.';
               this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.passwordError = err?.error?.message ?? 'Error al actualizar la contraseña.';
          this.cdr.markForCheck();
        },
      });
  }

  private resetPasswordForm(): void {
    this.passwordForm = { password_actual: '', password_nuevo: '', confirmar_password: '' };
    this.showActual   = false;
    this.showNuevo    = false;
    this.showConfirm  = false;
  }
}