import { Component, OnInit } from '@angular/core';
import { ClientesService, Cliente } from 'src/app/@theme/services/Cliente.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(private svc: ClientesService) {}

  ngOnInit(): void {
    this.loadClientes();
  }

  // ════════════════════════════════════════════════════
  //  CRUD
  // ════════════════════════════════════════════════════

  loadClientes(): void {
    this.svc.getAll().subscribe({
      next: (data: any) => {
        // El ApiService puede devolver el array o un objeto de error
        if (Array.isArray(data)) {
          this.clientes = data;
          this.applyFilter();
        }
      },
      error: () => this.showToast('Error al cargar clientes', true),
    });
  }

  saveCliente(): void {
    this.submitted = true;
    if (!this.form.nombre?.trim()) return;

    const obs = this.editingId
      ? this.svc.update(this.editingId, this.form)
      : this.svc.create(this.form);

    obs.subscribe({
      next: () => {
        this.loadClientes();
        this.showModal = false;
        this.submitted = false;
        this.showToast(this.editingId ? 'Cliente actualizado' : 'Cliente agregado');
      },
      error: () => this.showToast('Error al guardar el cliente', true),
    });
  }

  confirmDelete(): void {
    if (this.deletingId === null) return;
    this.svc.delete(this.deletingId).subscribe({
      next: () => {
        this.loadClientes();
        this.showConfirm = false;
        this.deletingId  = null;
        this.showToast('Cliente eliminado');
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

  /** Cierra modal si el clic fue sobre el fondo oscuro */
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
        || (c.apodo  || '').toLowerCase().includes(q)
        || (c.telefono || '').includes(q);
      const matchTipo = !this.filterTipo || c.tipo === this.filterTipo;
      return matchSearch && matchTipo;
    });
  }

  // ════════════════════════════════════════════════════
  //  Stats
  // ════════════════════════════════════════════════════

  get statCredito(): number {
    return this.clientes.reduce((s, c) => s + (c.limite_credito || 0), 0);
  }

  get statRegular(): number {
    return this.clientes.filter(c => c.tipo === 'regular').length;
  }

  get statOcasional(): number {
    return this.clientes.filter(c => c.tipo === 'ocasional').length;
  }

  get statCreditoFormateado(): string {
    const total = this.statCredito;
    return '$' + total.toLocaleString('es-CO', { minimumFractionDigits: 0 });
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

  /** Obtiene las iniciales de un nombre (máx. 2 letras) */
  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }
}