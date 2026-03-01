import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from 'src/app/@theme/services/api.service';
import { AuthService } from 'src/app/@theme/services/auth.service';
import { ModalResponseService } from 'src/app/@theme/services/modal-response.service'; // ✅

import { SharedModule } from 'src/app/demo/shared/shared.module';

interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss', '../authentication.scss']
})
export default class RegisterComponent implements OnInit {

  hide = true;
  coHide = true;
  roles: Rol[] = [];
  isLoading = false;

  registerForm = new FormGroup({
    nombre:          new FormControl('',        [Validators.required, Validators.minLength(2)]),
    apellido:        new FormControl('',        [Validators.required, Validators.minLength(2)]),
    email:           new FormControl('',        [Validators.required, Validators.email]),
    password:        new FormControl('',        [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('',        [Validators.required]),
    telefono:        new FormControl('',        [Validators.required]),
    direccion:       new FormControl('',        [Validators.required]),
    id_rol:          new FormControl<number | null>(null, [Validators.required]),
    acceptTerms:     new FormControl(false,     [Validators.requiredTrue])
  });

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private modalService: ModalResponseService // ✅
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/dashboard']);
      }
    }, 100);
  }

  loadRoles(): void {
    this.apiService.get<any>('roles').subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.roles = response.data;
        } else if (Array.isArray(response)) {
          this.roles = response;
        }
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
      }
    });
  }

  onSubmit(): void {
    // Validación del formulario en el frontend
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.modalService.show({
        title: 'Formulario incompleto',
        message: 'Por favor complete todos los campos requeridos',
        type: 'warning'
      });
      return;
    }

    const password        = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      this.modalService.show({
        title: 'Error de contraseña',
        message: 'Las contraseñas no coinciden',
        type: 'error'
      });
      return;
    }

    this.isLoading = true;

    const registerData = {
      nombre:          this.registerForm.get('nombre')?.value,
      apellido:        this.registerForm.get('apellido')?.value,
      email:           this.registerForm.get('email')?.value,
      password,
      confirmPassword,
      telefono:        this.registerForm.get('telefono')?.value,
      direccion:       this.registerForm.get('direccion')?.value,
      id_rol:          this.registerForm.get('id_rol')?.value
    };

    this.apiService.post<any>('auth/register', registerData).subscribe({
      next: (response) => {
        // ✅ El backend responde con ResponseHelper → showmodal viene incluido
        this.modalService.handleResponse(response);

        if (response.status === 'success') {
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al registrar:', error);
        // ✅ Muestra el mensaje de error que devuelve el backend (ej: "La contraseña debe tener al menos 6 caracteres")
        this.modalService.handleError(error);
        this.isLoading = false;
      }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    if (!control?.errors || !control.touched) return '';

    if (control.hasError('required'))   return 'Este campo es requerido';
    if (control.hasError('email'))      return 'Ingrese un email válido';
    if (control.hasError('minlength')) {
      const min = control.errors['minlength'].requiredLength;
      return `Debe tener al menos ${min} caracteres`;
    }
    return '';
  }
}