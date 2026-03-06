// angular import
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

// services
import { AuthService } from '../../../../@theme/services/auth.service';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';

@Component({
  selector: 'app-login',
  imports: [SharedModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', '../authentication.scss']
})
export default class LoginComponent implements OnInit, OnDestroy {
  // Form
  form: FormGroup;
  
  // UI State
  hidePassword = true;
  loading = false;
  errorMessage = '';
  
  // Lifecycle
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    // Verificar si ya hay sesión activa
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Getters para acceso fácil a los controles
  get email() {
    return this.form.get('email') as FormControl;
  }

  get password() {
    return this.form.get('password') as FormControl;
  }

  Olvidastetucontrase(): void {
    this.router.navigate(['/forgot-password']);
  }

  getErrorMessage(): string {
    if (this.email.hasError('required')) {
      return 'Debes ingresar un email';
    }
    return this.email.hasError('email') ? 'Email no válido' : '';
  }

  submit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.form.disable();

    const loginData = {
      email: this.form.value.email,
      password: this.form.value.password
    };

    this.authService.login(loginData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.status === 'success') {
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
              didOpen: (toast: any) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
              }
            });

            Toast.fire({
              icon: 'success',
              title: `¡Bienvenido ${response.data.user.nombre}!`
            });

            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 500);

          } else {
            this.errorMessage = response.message || 'Error al iniciar sesión';
            this.loading = false;
            this.form.enable();
            
            Swal.fire({
              icon: 'error',
              title: 'Error de autenticación',
              text: this.errorMessage,
            });
          }
        },
        error: (error) => {
          console.error('❌ Login - Error de conexión:', error);
          this.loading = false;
          this.form.enable();
          
          this.errorMessage = 'Error al conectar con el servidor';
          
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessage,
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}