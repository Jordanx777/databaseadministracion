import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { MarcasService, Marca } from 'src/app/@theme/services/Marcas.service';

type ModalType = 'create' | 'edit' | 'delete' | null;

@Component({
  selector: 'app-marcas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './marcas.component.html',
  styleUrls: ['./marcas.component.scss'],
})
export class MarcasComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────
  marcas: Marca[]   = [];
  filtered: Marca[] = [];

  // ── UI State ──────────────────────────────────────────
  searchTerm    = '';
  modalType: ModalType = null;
  selectedMarca: Marca | null = null;

  formData: Partial<Marca> = { nombre: '', descripcion: '' };
  formError  = '';

  isLoading  = false;   // carga inicial de la tabla
  isSaving   = false;   // spinner en botón de guardar
  isDeleting = false;   // spinner en botón de eliminar

  toast: { message: string; type: 'success' | 'error' | 'warning' } | null = null;

  // ── Internals ─────────────────────────────────────────
  private destroy$ = new Subject<void>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private marcasService: MarcasService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadMarcas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Load ──────────────────────────────────────────────
  loadMarcas(): void {
    this.isLoading = true;
    this.marcas    = [];
    this.filtered  = [];

    this.marcasService.getMarcas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.marcas = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          this.applyFilter();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.showToast('Error al cargar las marcas.', 'error');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Search ────────────────────────────────────────────
  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filtered = term
      ? this.marcas.filter(m => m.nombre.toLowerCase().includes(term))
      : [...this.marcas];
  }

  onSearch(): void {
    this.applyFilter();
  }

  // ── Modal controls ────────────────────────────────────
  openCreate(): void {
    this.formData  = { nombre: '', descripcion: '' };
    this.formError = '';
    this.modalType = 'create';
  }

  openEdit(marca: Marca): void {
    this.selectedMarca = marca;
    this.formData  = { nombre: marca.nombre, descripcion: marca.descripcion ?? '' };
    this.formError = '';
    this.modalType = 'edit';
  }

  openDelete(marca: Marca): void {
    this.selectedMarca = marca;
    this.modalType     = 'delete';
  }

  closeModal(): void {
    this.modalType     = null;
    this.selectedMarca = null;
    this.formError     = '';
    this.isSaving      = false;
    this.isDeleting    = false;
  }

  // ── CRUD ──────────────────────────────────────────────
  handleCreate(): void {
    if (!this.validateForm()) return;

    this.isSaving = true;
    this.marcasService.createMarca(this.formData as Marca)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.showToast('Marca creada correctamente.', 'success');
          this.loadMarcas();
        },
        error: (err) => {
          this.formError = err?.error?.message ?? 'Error al crear la marca.';
        },
      });
  }

  handleEdit(): void {
    if (!this.validateForm()) return;

    const id = this.selectedMarca?.id;
    if (!id) return;

    this.isSaving = true;
    this.marcasService.updateMarca(id, this.formData as Marca)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (res) => {
          this.closeModal();
          if (res?.type === 'success') {
            this.showToast('Marca actualizada correctamente.', 'success');
          } else {
            this.showToast(res?.message ?? 'Respuesta inesperada del servidor.', 'warning');
          }
          this.loadMarcas();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.formError = err?.error?.message ?? 'Error al actualizar la marca.';
        },
      });
  }

  handleDelete(): void {
    const id = this.selectedMarca?.id;
    if (!id) return;

    this.isDeleting = true;
    this.marcasService.deleteMarca(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isDeleting = false))
      )
      .subscribe({
        next: (res) => {
          this.closeModal();
          if (res?.type === 'success') {
            this.showToast('Marca eliminada correctamente.', 'success');
          } else {
            this.showToast(res?.message ?? 'Respuesta inesperada del servidor.', 'warning');
          }
          this.loadMarcas();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.closeModal();
          this.showToast(err?.error?.message ?? 'Error al eliminar la marca.', 'error');
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
    // Normaliza '2026-02-08 22:10:50.51661' → '2026-02-08T22:10:50'
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