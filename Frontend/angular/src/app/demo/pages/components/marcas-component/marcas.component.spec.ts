import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { MarcasComponent } from './marcas.component';
import { MarcasService, Marca } from 'src/app/@theme/services/Marcas.service';

// ── Mock data ─────────────────────────────────────────────────────────────────
const mockMarcas: Marca[] = [
  { id: 1, nombre: 'Nike',      created_at: '2026-01-01 10:00:00' },
  { id: 2, nombre: 'Adidas',    created_at: '2026-01-02 10:00:00' },
  { id: 3, nombre: 'Puma',      created_at: '2026-01-03 10:00:00' },
];

const mockApiResponse = {
  success: true,
  message: 'Marcas obtenidas exitosamente',
  data: mockMarcas,
};

// ── Mock service ──────────────────────────────────────────────────────────────
const marcasServiceMock = {
  getMarcas:    jasmine.createSpy('getMarcas').and.returnValue(of(mockApiResponse)),
  getMarca:     jasmine.createSpy('getMarca').and.returnValue(of(mockMarcas[0])),
  createMarca:  jasmine.createSpy('createMarca').and.returnValue(of({ success: true })),
  updateMarca:  jasmine.createSpy('updateMarca').and.returnValue(of({ success: true })),
  deleteMarca:  jasmine.createSpy('deleteMarca').and.returnValue(of({ success: true })),
};

// ── Suite ─────────────────────────────────────────────────────────────────────
describe('MarcasComponent', () => {
  let component: MarcasComponent;
  let fixture: ComponentFixture<MarcasComponent>;
  let service: typeof marcasServiceMock;

  beforeEach(async () => {
    // Resetea los spies antes de cada test
    marcasServiceMock.getMarcas.calls.reset();
    marcasServiceMock.createMarca.calls.reset();
    marcasServiceMock.updateMarca.calls.reset();
    marcasServiceMock.deleteMarca.calls.reset();

    marcasServiceMock.getMarcas.and.returnValue(of(mockApiResponse));

    await TestBed.configureTestingModule({
      imports: [MarcasComponent, CommonModule, FormsModule],
      providers: [
        { provide: MarcasService, useValue: marcasServiceMock },
        { provide: ChangeDetectorRef, useValue: { markForCheck: () => {} } },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(MarcasComponent);
    component = fixture.componentInstance;
    service   = TestBed.inject(MarcasService) as any;

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  // ── Creación ────────────────────────────────────────────────────────────────
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Carga inicial ───────────────────────────────────────────────────────────
  it('should load marcas on init', () => {
    expect(service.getMarcas).toHaveBeenCalledTimes(1);
    expect(component.marcas.length).toBe(3);
    expect(component.filtered.length).toBe(3);
    expect(component.isLoading).toBeFalse();
  });

  it('should parse response wrapped in { data: [...] }', () => {
    expect(component.marcas[0].nombre).toBe('Nike');
    expect(component.marcas[1].nombre).toBe('Adidas');
  });

  it('should show error toast when getMarcas fails', fakeAsync(() => {
    marcasServiceMock.getMarcas.and.returnValue(throwError(() => new Error('Network error')));
    component.loadMarcas();
    tick();
    expect(component.isLoading).toBeFalse();
    expect(component.toast?.type).toBe('error');
  }));

  // ── Búsqueda ─────────────────────────────────────────────────────────────────
  it('should filter marcas by search term', () => {
    component.searchTerm = 'nik';
    component.onSearch();
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].nombre).toBe('Nike');
  });

  it('should reset filter when search is cleared', () => {
    component.searchTerm = 'nike';
    component.onSearch();
    component.searchTerm = '';
    component.onSearch();
    expect(component.filtered.length).toBe(3);
  });

  // ── Modal: Crear ─────────────────────────────────────────────────────────────
  it('should open create modal with empty form', () => {
    component.openCreate();
    expect(component.modalType).toBe('create');
    expect(component.formData.nombre).toBe('');
  });

  it('should not create if nombre is empty', () => {
    component.openCreate();
    component.formData = { nombre: '   ' };
    component.handleCreate();
    expect(service.createMarca).not.toHaveBeenCalled();
    expect(component.formError).toBeTruthy();
  });

  it('should call createMarca and reload on success', fakeAsync(() => {
    component.openCreate();
    component.formData = { nombre: 'Puma Nueva' };
    component.handleCreate();
    tick();
    expect(service.createMarca).toHaveBeenCalledWith({ nombre: 'Puma Nueva' } as Marca);
    expect(service.getMarcas).toHaveBeenCalledTimes(2); // init + reload
    expect(component.modalType).toBeNull();
    expect(component.toast?.type).toBe('success');
  }));

  it('should show formError when createMarca fails', fakeAsync(() => {
    marcasServiceMock.createMarca.and.returnValue(
      throwError(() => ({ error: { message: 'Nombre duplicado' } }))
    );
    component.openCreate();
    component.formData = { nombre: 'Nike' };
    component.handleCreate();
    tick();
    expect(component.formError).toBe('Nombre duplicado');
    expect(component.modalType).toBe('create');
  }));

  // ── Modal: Editar ─────────────────────────────────────────────────────────────
  it('should open edit modal with prefilled data', () => {
    component.openEdit(mockMarcas[0]);
    expect(component.modalType).toBe('edit');
    expect(component.formData.nombre).toBe('Nike');
    expect(component.selectedMarca).toEqual(mockMarcas[0]);
  });

  it('should call updateMarca and reload on success', fakeAsync(() => {
    component.openEdit(mockMarcas[0]);
    component.formData = { nombre: 'Nike Updated' };
    component.handleEdit();
    tick();
    expect(service.updateMarca).toHaveBeenCalledWith(1, { nombre: 'Nike Updated' } as Marca);
    expect(component.modalType).toBeNull();
    expect(component.toast?.type).toBe('success');
  }));

  it('should not call updateMarca if no selectedMarca id', () => {
    component.selectedMarca = { nombre: 'Sin ID' }; // sin id
    component.formData = { nombre: 'Algo' };
    component.handleEdit();
    expect(service.updateMarca).not.toHaveBeenCalled();
  });

  // ── Modal: Eliminar ───────────────────────────────────────────────────────────
  it('should open delete modal with selected marca', () => {
    component.openDelete(mockMarcas[1]);
    expect(component.modalType).toBe('delete');
    expect(component.selectedMarca?.nombre).toBe('Adidas');
  });

  it('should call deleteMarca and reload on success', fakeAsync(() => {
    component.openDelete(mockMarcas[1]);
    component.handleDelete();
    tick();
    expect(service.deleteMarca).toHaveBeenCalledWith(2);
    expect(component.modalType).toBeNull();
    expect(component.toast?.type).toBe('warning');
  }));

  it('should show error toast when deleteMarca fails', fakeAsync(() => {
    marcasServiceMock.deleteMarca.and.returnValue(
      throwError(() => ({ error: { message: 'No se puede eliminar' } }))
    );
    component.openDelete(mockMarcas[0]);
    component.handleDelete();
    tick();
    expect(component.toast?.type).toBe('error');
    expect(component.toast?.message).toBe('No se puede eliminar');
  }));

  // ── closeModal ────────────────────────────────────────────────────────────────
  it('should reset state on closeModal', () => {
    component.openCreate();
    component.formError = 'Algún error';
    component.closeModal();
    expect(component.modalType).toBeNull();
    expect(component.selectedMarca).toBeNull();
    expect(component.formError).toBe('');
    expect(component.isSaving).toBeFalse();
    expect(component.isDeleting).toBeFalse();
  });

  // ── formatDate ────────────────────────────────────────────────────────────────
  it('should format postgres date string correctly', () => {
    const result = component.formatDate('2026-02-08 22:10:50.51661');
    expect(result).not.toBe('—');
    expect(result.length).toBeGreaterThan(4);
  });

  it('should return "—" for empty date', () => {
    expect(component.formatDate('')).toBe('—');
  });

  // ── Destroy ───────────────────────────────────────────────────────────────────
  it('should complete destroy$ on ngOnDestroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});