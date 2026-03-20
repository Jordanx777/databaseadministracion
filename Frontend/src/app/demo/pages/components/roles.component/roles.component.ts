import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { RolesService, Rol } from 'src/app/@theme/services/Roles.services';

type ModalType = 'create' | 'edit' | 'delete' | null;

@Component({
  selector: 'app-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────
  roles: Rol[]    = [];
  filtered: Rol[] = [];

  // ── UI State ──────────────────────────────────────────
  searchTerm   = '';
  modalType: ModalType = null;
  selectedRol: Rol | null = null;

  formData: Partial<Rol> = { nombre: '', descripcion: '', activo: true };
  formError  = '';

  isLoading  = false;
  isSaving   = false;
  isDeleting = false;

  toast: { message: string; type: 'success' | 'error' | 'warning' } | null = null;

  // ── Internals ─────────────────────────────────────────
  private destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private rolesService: RolesService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Load ──────────────────────────────────────────────
  loadRoles(): void {
    this.isLoading = true;
    this.roles     = [];
    this.filtered  = [];

    this.rolesService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.roles = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          this.applyFilter();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.showToast('Error al cargar los roles.', 'error');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Search ────────────────────────────────────────────
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filtered = term
      ? this.roles.filter(r =>
          r.nombre.toLowerCase().includes(term) ||
          (r.descripcion ?? '').toLowerCase().includes(term)
        )
      : [...this.roles];
  }

  onSearch(): void {
    this.applyFilter();
    this.cdr.markForCheck();
  }

  // ── Modal controls ────────────────────────────────────
  openCreate(): void {
    this.formData  = { nombre: '', descripcion: '', activo: true };
    this.formError = '';
    this.modalType = 'create';
  }

  openEdit(rol: Rol): void {
    this.selectedRol = rol;
    this.formData    = {
      nombre:      rol.nombre,
      descripcion: rol.descripcion ?? '',
      activo:      rol.activo ?? true,
    };
    this.formError = '';
    this.modalType = 'edit';
  }

  openDelete(rol: Rol): void {
    this.selectedRol = rol;
    this.modalType   = 'delete';
  }

  closeModal(): void {
    this.modalType   = null;
    this.selectedRol = null;
    this.formError   = '';
    this.isSaving    = false;
    this.isDeleting  = false;
  }

  // ── CRUD ──────────────────────────────────────────────
  handleCreate(): void {
    if (!this.validateForm()) return;

    this.isSaving = true;
    this.rolesService.createRol(this.formData as Rol)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (res) => {
          this.closeModal();
          if (res?.type === 'success') {
            this.showToast('Rol creado correctamente.', 'success');
          } else {
            this.showToast(res?.message ?? 'Respuesta inesperada del servidor.', 'warning');
          }
          this.loadRoles();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.formError = err?.error?.message ?? 'Error al crear el rol.';
          this.cdr.markForCheck();
        },
      });
  }

  handleEdit(): void {
    if (!this.validateForm()) return;

    const id = this.selectedRol?.id_rol;
    if (!id) return;

    this.isSaving = true;
    this.rolesService.updateRol(id, this.formData as Rol)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (res) => {
          this.closeModal();
          if (res?.type === 'success') {
            this.showToast('Rol actualizado correctamente.', 'success');
          } else {
            this.showToast(res?.message ?? 'Respuesta inesperada del servidor.', 'warning');
          }
          this.loadRoles();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.formError = err?.error?.message ?? 'Error al actualizar el rol.';
          this.cdr.markForCheck();
        },
      });
  }

  handleDelete(): void {
    const id = this.selectedRol?.id_rol;
    if (!id) return;

    this.isDeleting = true;
    this.rolesService.deleteRol(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isDeleting = false))
      )
      .subscribe({
        next: (res) => {
          this.closeModal();
          if (res?.type === 'success') {
            this.showToast('Rol eliminado correctamente.', 'success');
          } else {
            this.showToast(res?.message ?? 'Respuesta inesperada del servidor.', 'warning');
          }
          this.loadRoles();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.closeModal();
          this.showToast(err?.error?.message ?? 'Error al eliminar el rol.', 'error');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────
  private validateForm(): boolean {
    if (!this.formData.nombre?.trim()) {
      this.formError = 'El nombre es requerido.';
      return false;
    }
    this.formError = '';
    return true;
  }

  clearError(): void {
    this.formError = '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const normalized = dateStr.replace(' ', 'T').split('.')[0];
    const date = new Date(normalized);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 3200);
  }
}