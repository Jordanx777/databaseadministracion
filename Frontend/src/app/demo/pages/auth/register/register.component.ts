// angular import
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Services
import { ApiService } from 'src/app/@theme/services/api.service';
import { AuthService } from 'src/app/@theme/services/auth.service';

// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';

interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string;
}

interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono: string;
  direccion: string;
  id_rol: number;
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
  // public props
  hide = true;
  coHide = true;
  roles: Rol[] = [];
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  // FormGroup para manejar todo el formulario
  registerForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(2)]),
    apellido: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required]),
    telefono: new FormControl('', [Validators.required]),
    direccion: new FormControl('', [Validators.required]),
    id_rol: new FormControl<number | null>(null, [Validators.required]),
    acceptTerms: new FormControl(false, [Validators.requiredTrue])
  });

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Cargar roles primero
    this.loadRoles();
    
    // Verificar autenticación después de un pequeño delay
    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/dashboard']);
      }
    }, 100);
  }

  loadRoles(): void {
    this.apiService.get<any>('roles').subscribe({
      next: (response) => {
        if (response.success) {  
        this.roles = response.data;
      } else {
        console.error('Respuesta inesperada:', response);
      }
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
      }
    });
  }

  onSubmit(): void {
  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();

    Swal.fire({
      icon: 'warning',
      title: 'Formulario incompleto',
      text: 'Por favor complete todos los campos requeridos'
    });

    return;
  }

  const password = this.registerForm.get('password')?.value;
  const confirmPassword = this.registerForm.get('confirmPassword')?.value;

  if (password !== confirmPassword) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Las contraseñas no coinciden'
    });
    return;
  }

  this.isLoading = true;

  const registerData: any = {
    nombre: this.registerForm.get('nombre')?.value,
    apellido: this.registerForm.get('apellido')?.value,
    email: this.registerForm.get('email')?.value,
    password: password,
    confirmPassword: confirmPassword,
    telefono: this.registerForm.get('telefono')?.value,
    direccion: this.registerForm.get('direccion')?.value,
    id_rol: this.registerForm.get('id_rol')?.value
  };

  this.apiService.post<any>('auth/register', registerData).subscribe({
    next: (response) => {
      this.isLoading = false;

      if (response.status === 'success') {

        Swal.fire({
          icon: 'success',
          title: 'Registro exitoso',
          text: response.message,
          timer: 2000,
          showConfirmButton: false
        });

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Error al registrar usuario'
        });
      }
    },

    error: (error) => {
      this.isLoading = false;

      const mensaje = error.error?.message || 'Error al conectar con el servidor';

      Swal.fire({
        icon: 'error',
        title: 'Error de registro',
        text: mensaje
      });
    }
  });
}

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (field === 'email' && control.hasError('email')) {
      return 'Ingrese un email válido';
    }

    if (field === 'password' && control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    if (field === 'nombre' || field === 'apellido') {
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 2 caracteres';
      }
    }

    return '';
  }
}