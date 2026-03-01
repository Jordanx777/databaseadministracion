import { Injectable,NgZone} from '@angular/core';
import { BehaviorSubject } from 'rxjs'; // ← cambiar Subject por BehaviorSubject
import { filter } from 'rxjs/operators';


export interface ModalData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ModalResponseService {
 // ✅ BehaviorSubject con null como valor inicial
  private modalSubject = new BehaviorSubject<ModalData | null>(null);

  // ✅ Filtra los null para que el componente no reaccione al inicio
  modal$ = this.modalSubject.asObservable().pipe(
    filter((data): data is ModalData => data !== null)
  );
  // 3046128918 sabina
  
  constructor(private ngZone: NgZone) {}  // ✅

  show(data: ModalData): void {
    // ✅ Fuerza la ejecución dentro de la zona de Angular
    this.ngZone.run(() => {
      this.modalSubject.next(data);
    });
  }

  /** Parsea automáticamente la respuesta del backend */
  handleResponse(response: any): void {
    if (response?.showmodal) {
      this.show({
        title: response.showmodal.title,
        message: response.showmodal.message,
        type: response.showmodal.type,
      });
    }
  }

  handleError(error: any): void {
    const body = error?.error;
    if (body?.showmodal) {
      this.show({
        title: body.showmodal.title,
        message: body.showmodal.message,
        type: 'error',
      });
    } else {
      this.show({
        title: 'Error',
        message: body?.message || 'Ocurrió un error inesperado',
        type: 'error',
      });
    }
  }
}