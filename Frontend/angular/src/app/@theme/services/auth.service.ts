import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject, filter, map } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  id_rol: number;
  rol_nombre: string;
  activo: boolean;
}

export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  id_rol: number;
}

export interface LoginData {
  email: string;
  password: string;
}

// null = todavía verificando | User = autenticado | false = no autenticado
type AuthState = User | null | false;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // null = cargando, false = no autenticado, User = autenticado
  private authState = new BehaviorSubject<AuthState>(null);

  // Observable del usuario actual (null si no autenticado o cargando)
  public currentUser$ = this.authState.asObservable().pipe(
    map(state => (state === false ? null : state))
  );

  //  Solo emite cuando checkAuthStatus() ya terminó
  // true = autenticado, false = no autenticado
  public authReady$ = this.authState.asObservable().pipe(
    filter((state): state is User | false => state !== null),
    map(state => state !== false)
  );

  constructor(private apiService: ApiService) {
    this.checkAuthStatus();
  }

  // Registro
  register(data: RegisterData): Observable<any> {
    return this.apiService.post('auth/register', data).pipe(
      tap((response: any) => {
        if (response.status === 'success') {
          this.authState.next(response.data.user);
        }
      })
    );
  }

  // Login
  login(data: LoginData): Observable<any> {
    return this.apiService.post('auth/login', data).pipe(
      tap((response: any) => {
        if (response.status === 'success') {
          this.authState.next(response.data.user);
        }
      })
    );
  }

  // Logout
  logout(): Observable<any> {
    return this.apiService.post('auth/logout', {}).pipe(
      tap(() => {
        this.authState.next(false);
      })
    );
  }

  // Verificar estado de autenticación al iniciar la app
  checkAuthStatus(): void {
    this.apiService.get<any>('auth/me').subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.authState.next(response.data.user); //  Autenticado
        } else {
          this.authState.next(false); //  No autenticado
        }
      },
      error: () => {
        this.authState.next(false); //  Error = no autenticado
      }
    });
  }

  // Obtener usuario actual de forma síncrona
  getCurrentUser(): User | null {
    const state = this.authState.value;
    return (state === null || state === false) ? null : state;
  }

  // Solo usar cuando el estado ya está resuelto
  isAuthenticated(): boolean {
    const state = this.authState.value;
    return state !== null && state !== false;
  }

    // Paso 1 — solicitar reset (envía email)
  forgotPassword(correo: string): Observable<any> {
    return this.apiService.post('auth/forgot-password', { correo });
  }

  // Paso 2 — validar token antes de mostrar el form
  validateResetToken(token: string): Observable<any> {
    return this.apiService.get(`auth/validate-token?token=${token}`);
  }

  // Paso 3 — resetear con el token
  resetPassword(token: string, password: string, confirmPassword: string): Observable<any> {
    return this.apiService.post('auth/reset-password', { token, password, confirmPassword });
  }

    changePassword(passwordActual: string, passwordNuevo: string, confirmarPassword: string): Observable<any> {
    return this.apiService.post('auth/change-password', {
      password_actual:    passwordActual,
      password_nuevo:     passwordNuevo,
      confirmar_password: confirmarPassword,
    });
  }
}