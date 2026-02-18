import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService, Cliente } from 'src/app/@theme/services/Cliente.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent implements OnInit {

  // ── Data ────────────────────────────────────────────
  clientes: Cliente[] = [];
  filtered: Cliente[] = [];

  // ── Filtros ─────────────────────────────────────────
  searchTerm = '';
  filterTipo = '';

  // ── Modal form ──────────────────────────────────────
  showModal   = false;
  editingId: number | null = null;
  submitted   = false;
  form: Partial<Cliente> = this.defaultForm();

  // ── Modal confirmar ─────────────────────────────────
  showConfirm = false;
  deletingId: number | null = null;

  // ── Toast ───────────────────────────────────────────
  toastVisible = false;
  toastError   = false;
  toastMessage = '';
  private toastTimer: any;

  constructor(
    private svc: ClientesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadClientes();
  }

  // ════════════════════════════════════════════════════
  //  CRUD
  // ════════════════════════════════════════════════════

  loadClientes(): void {
    this.svc.getAll().subscribe({
      next: (data: any) => {
        // El ApiService captura errores con catchError y los devuelve como objeto,
        // por eso verificamos que sea un array antes de asignar.
        if (Array.isArray(data)) {
          this.clientes = [...data];   // nueva referencia → Angular detecta el cambio
          this.applyFilter();
          this.cdr.detectChanges();
        } else {
          // La respuesta fue un objeto de error del ApiService
          this.showToast('Error al cargar clientes', true);
        }
      },
      error: () => this.showToast('Error al cargar clientes', true),
    });
  }

  saveCliente(): void {
    this.submitted = true;
    if (!this.form.nombre?.trim()) return;

    const esEdicion = !!this.editingId;
    const obs = esEdicion
      ? this.svc.update(this.editingId!, this.form)
      : this.svc.create(this.form);

    obs.subscribe({
      next: (resp: any) => {
        // Si el ApiService devolvió un objeto de error no lanzamos éxito
        if (resp && resp.modal?.type === 'error') {
          this.showToast('Error al guardar el cliente', true);
          return;
        }
        this.showModal = false;
        this.submitted = false;
        this.showToast(esEdicion ? 'Cliente actualizado' : 'Cliente agregado');
        this.loadClientes();    // recarga después de cerrar modal
      },
      error: () => this.showToast('Error al guardar el cliente', true),
    });
  }

  confirmDelete(): void {
    if (this.deletingId === null) return;
    const id = this.deletingId;

    this.svc.delete(id).subscribe({
      next: (resp: any) => {
        if (resp && resp.modal?.type === 'error') {
          this.showToast('Error al eliminar el cliente', true);
          return;
        }
        this.showConfirm = false;
        this.deletingId  = null;
        this.showToast('Cliente eliminado');
        this.loadClientes();
      },
      error: () => this.showToast('Error al eliminar el cliente', true),
    });
  }

  // ════════════════════════════════════════════════════
  //  Modales
  // ════════════════════════════════════════════════════

  openModal(cliente?: Cliente): void {
    this.form      = cliente ? { ...cliente } : this.defaultForm();
    this.editingId = cliente?.id ?? null;
    this.submitted = false;
    this.showModal = true;
  }

  askDelete(id: number): void {
    this.deletingId  = id;
    this.showConfirm = true;
  }

  onOverlayClick(event: MouseEvent, type: 'form' | 'confirm'): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      if (type === 'form')    this.showModal   = false;
      if (type === 'confirm') this.showConfirm = false;
    }
  }

  // ════════════════════════════════════════════════════
  //  Filtros
  // ════════════════════════════════════════════════════

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    this.filtered = this.clientes.filter(c => {
      const matchSearch = !q
        || c.nombre.toLowerCase().includes(q)
        || (c.apodo    || '').toLowerCase().includes(q)
        || (c.telefono || '').includes(q);
      const matchTipo = !this.filterTipo || c.tipo === this.filterTipo;
      return matchSearch && matchTipo;
    });
  }

  // ════════════════════════════════════════════════════
  //  Stats
  // ════════════════════════════════════════════════════

  get statRegular(): number {
    return this.clientes.filter(c => c.tipo === 'regular').length;
  }

  get statOcasional(): number {
    return this.clientes.filter(c => c.tipo === 'ocasional').length;
  }

  get statCreditoFormateado(): string {
    const total = this.clientes.reduce((s, c) => s + (Number(c.limite_credito) || 0), 0);
    // toLocaleString puede variar según el navegador; usamos Intl para control total
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(total);
  }

  // ════════════════════════════════════════════════════
  //  Helpers
  // ════════════════════════════════════════════════════

  defaultForm(): Partial<Cliente> {
    return {
      nombre: '',
      apodo: '',
      telefono: '',
      direccion: '',
      referencia: '',
      limite_credito: 0,
      tipo: 'regular',
    };
  }

  showToast(message: string, error = false): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastError   = error;
    this.toastVisible = true;
    this.toastTimer   = setTimeout(() => (this.toastVisible = false), 3000);
  }

  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  formatCredito(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(valor));
  }
}