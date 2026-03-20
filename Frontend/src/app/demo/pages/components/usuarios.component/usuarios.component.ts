import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { UsuariosService, Usuario, CreateUsuarioData, PaginatedResult } from 'src/app/@theme/services/Usuarios.service';
import { RolesService, Rol } from 'src/app/@theme/services/Roles.services';

type ModalType = 'create' | 'edit' | 'delete' | null;

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────
  usuarios: Usuario[]  = [];
  roles: Rol[]         = [];

  // ── Paginación ────────────────────────────────────────
  currentPage  = 1;
  perPage      = 10;
  totalItems   = 0;
  lastPage     = 1;
  pages:       number[] = [];

  // ── Filtros ───────────────────────────────────────────
  searchTerm   = '';
  filterActivo = '';          // '' | 'true' | 'false'
  filterRol: number | '' = '';

  // ── UI State ──────────────────────────────────────────
  modalType: ModalType      = null;
  selectedUsuario: Usuario | null = null;

  createForm: CreateUsuarioData = {
    nombre: '', apellido: '', correo: '', password: '',
    telefono: '', direccion: '', id_rol: 0, activo: true,
  };

  editForm: Partial<Usuario> = {
    nombre: '', apellido: '', correo: '',
    telefono: '', direccion: '', id_rol: 0, activo: true,
  };

  formError   = '';
  isLoading   = false;
  isSaving    = false;
  isDeleting  = false;
  togglingId: number | null = null;   // id del usuario cuyo toggle está en curso
  changingRolId: number | null = null;

  toast: { message: string; type: 'success' | 'error' | 'warning' } | null = null;

  // ── Internals ─────────────────────────────────────────
  private destroy$    = new Subject<void>();
  private search$     = new Subject<string>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private usuariosService: UsuariosService,
    private rolesService: RolesService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadRoles();
    this.loadUsuarios();

    // Debounce en búsqueda para no llamar la API en cada tecla
    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadUsuarios();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Load ──────────────────────────────────────────────
  loadUsuarios(): void {
    this.isLoading = true;

    this.usuariosService.getUsuarios({
      search:   this.searchTerm,
      activo:   this.filterActivo,
      id_rol:   this.filterRol,
      page:     this.currentPage,
      per_page: this.perPage,
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        const result: PaginatedResult = res?.data ?? res;
        this.usuarios   = result.data       ?? [];
        this.totalItems = result.total      ?? 0;
        this.lastPage   = result.last_page  ?? 1;
        this.currentPage= result.page       ?? 1;
        this.buildPages();
        this.isLoading  = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Error al cargar los usuarios.', 'error');
        this.cdr.markForCheck();
      },
    });
  }

  loadRoles(): void {
    this.rolesService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const all: Rol[] = Array.isArray(res) ? res : (res?.data ?? []);
          this.roles = all.filter(r => r.activo !== false);
          this.cdr.markForCheck();
        },
        error: () => {},
      });
  }

  // ── Paginación ────────────────────────────────────────
  buildPages(): void {
    // Ventana deslizante de máx 5 páginas
    const delta = 2;
    const start = Math.max(1, this.currentPage - delta);
    const end   = Math.min(this.lastPage, this.currentPage + delta);
    this.pages  = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage || page === this.currentPage) return;
    this.currentPage = page;
    this.loadUsuarios();
  }

  onPerPageChange(): void {
    this.currentPage = 1;
    this.loadUsuarios();
  }

  // ── Filtros ───────────────────────────────────────────
  onSearch(): void {
    this.search$.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsuarios();
  }

  clearFilters(): void {
    this.searchTerm   = '';
    this.filterActivo = '';
    this.filterRol    = '';
    this.currentPage  = 1;
    this.loadUsuarios();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.filterActivo !== '' || this.filterRol !== '');
  }

  // ── Toggle activo inline ──────────────────────────────
  toggleActivo(usuario: Usuario): void {
    const id      = usuario.id_usuario!;
    const newVal  = !usuario.activo;
    this.togglingId = id;

    this.usuariosService.toggleActivo(id, newVal)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.togglingId = null; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: (res) => {
          if (res?.type === 'success') {
            usuario.activo = newVal;
            this.showToast(
              newVal ? 'Usuario activado.' : 'Usuario desactivado.',
              newVal ? 'success' : 'warning'
            );
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.showToast(err?.error?.message ?? 'Error al cambiar estado.', 'error');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Cambiar rol inline ────────────────────────────────
  changeRol(usuario: Usuario, id_rol: number): void {
    const id = usuario.id_usuario!;
    this.changingRolId = id;

    this.usuariosService.changeRol(id, id_rol)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.changingRolId = null; this.cdr.markForCheck(); })
      )
      .subscribe({
        next: (res) => {
          if (res?.type === 'success') {
            usuario.id_rol     = id_rol;
            usuario.rol_nombre = this.roles.find(r => r.id_rol === id_rol)?.nombre ?? '';
            this.showToast('Rol actualizado.', 'success');
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.showToast(err?.error?.message ?? 'Error al cambiar rol.', 'error');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Modal controls ────────────────────────────────────
  openCreate(): void {
    this.createForm = {
      nombre: '', apellido: '', correo: '', password: '',
      telefono: '', direccion: '',
      id_rol: this.roles[0]?.id_rol ?? 0,
      activo: true,
    };
    this.formError = '';
    this.modalType = 'create';
  }

  openEdit(usuario: Usuario): void {
    this.selectedUsuario = usuario;
    this.editForm = {
      nombre:    usuario.nombre,
      apellido:  usuario.apellido  ?? '',
      correo:    usuario.correo,
      telefono:  usuario.telefono  ?? '',
      direccion: usuario.direccion ?? '',
      id_rol:    usuario.id_rol,
      activo:    usuario.activo    ?? true,
    };
    this.formError = '';
    this.modalType = 'edit';
  }

  openDelete(usuario: Usuario): void {
    this.selectedUsuario = usuario;
    this.modalType       = 'delete';
  }

  closeModal(): void {
    this.modalType       = null;
    this.selectedUsuario = null;
    this.formError       = '';
    this.isSaving        = false;
    this.isDeleting      = false;
  }

  // ── CRUD ──────────────────────────────────────────────
  handleCreate(): void {
    if (!this.validateCreateForm()) return;
    this.isSaving = true;

    this.usuariosService.createUsuario(this.createForm)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (res) => {
          this.closeModal();
          if (res?.type === 'success') {
            this.showToast('Usuario creado correctamente.', 'success');
          } else {
            this.showToast(res?.message ?? 'Respuesta inesperada.', 'warning');
          }
          this.loadUsuarios();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.formError = err?.error?.message ?? 'Error al crear el usuario.';
          this.cdr.markForCheck();
        },
      });
  }

  handleEdit(): void {
    if (!this.validateEditForm()) return;
    const id = this.selectedUsuario?.id_usuario;
    if (!id) return;
    this.isSaving = true;

    this.usuariosService.updateUsuario(id, this.editForm)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (res) => {
          this.closeModal();
          if (res?.type === 'success') {
            this.showToast('Usuario actualizado correctamente.', 'success');
          } else {
            this.showToast(res?.message ?? 'Respuesta inesperada.', 'warning');
          }
          this.loadUsuarios();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.formError = err?.error?.message ?? 'Error al actualizar el usuario.';
          this.cdr.markForCheck();
        },
      });
  }

  handleDelete(): void {
    const id = this.selectedUsuario?.id_usuario;
    if (!id) return;
    this.isDeleting = true;

    this.usuariosService.deleteUsuario(id)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: (res) => {
          this.closeModal();
          if (res?.type === 'success') {
            this.showToast('Usuario eliminado.', 'success');
          } else {
            this.showToast(res?.message ?? 'Respuesta inesperada.', 'warning');
          }
          this.loadUsuarios();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.closeModal();
          this.showToast(err?.error?.message ?? 'Error al eliminar.', 'error');
          this.cdr.markForCheck();
        },
      });
  }

  // ── Validaciones ──────────────────────────────────────
  private validateCreateForm(): boolean {
    if (!this.createForm.nombre?.trim())       { this.formError = 'El nombre es requerido.'; return false; }
    if (!this.createForm.correo?.trim())       { this.formError = 'El correo es requerido.'; return false; }
    if (!this.createForm.password?.trim())     { this.formError = 'La contraseña es requerida.'; return false; }
    if (this.createForm.password.length < 6)   { this.formError = 'Mínimo 6 caracteres.'; return false; }
    if (!this.createForm.id_rol)               { this.formError = 'Selecciona un rol.'; return false; }
    this.formError = ''; return true;
  }

  private validateEditForm(): boolean {
    if (!this.editForm.nombre?.trim())  { this.formError = 'El nombre es requerido.'; return false; }
    if (!this.editForm.correo?.trim())  { this.formError = 'El correo es requerido.'; return false; }
    if (!this.editForm.id_rol)          { this.formError = 'Selecciona un rol.'; return false; }
    this.formError = ''; return true;
  }

  clearError(): void { this.formError = ''; }

  // ── Helpers ───────────────────────────────────────────
  getInitials(u: Usuario): string {
    return ((u.nombre?.[0] ?? '') + (u.apellido?.[0] ?? '')).toUpperCase();
  }

  getRolNombre(id_rol: number): string {
    return this.roles.find(r => r.id_rol === id_rol)?.nombre ?? '—';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr.replace(' ', 'T').split('.')[0]);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => { this.toast = null; this.cdr.markForCheck(); }, 3200);
  }
}