import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
//   private BASE_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class ApiService {

//   private BASE_URL = environment.apiUrl;
  private BASE_URL = "http://localhost:8080/api/";

  constructor(private http: HttpClient) {}

  private getHeaders(isFormData = false) {
    let headers = new HttpHeaders();
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  get<T>(accion: string) {
    return this.http.get<T>(`${this.BASE_URL}${accion}`, {
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  post<T>(accion: string, data: any) {
    return this.http.post<T>(`${this.BASE_URL}${accion}`, data, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  postFormData<T>(accion: string, data: FormData) {
    return this.http.post<T>(`${this.BASE_URL}${accion}`, data, {
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  put<T>(accion: string, data: any) {
    return this.http.put<T>(`${this.BASE_URL}${accion}`, data, {
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  putFormData<T>(accion: string, data: FormData) {
    return this.http.put<T>(`${this.BASE_URL}${accion}`, data, {
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  delete<T>(accion: string) {
    return this.http.delete<T>(`${this.BASE_URL}${accion}`, {
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  deleteWithBody<T>(accion: string, data: any) {
    return this.http.request<T>('delete', `${this.BASE_URL}${accion}`, {
      body: data,
      headers: this.getHeaders(),
      withCredentials: true
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    return of({
      showModal: true,
      modal: {
        title: 'Error de conexión',
        message: 'No se pudo contactar con el servidor',
        type: 'error'
      }
    });
  }
}
