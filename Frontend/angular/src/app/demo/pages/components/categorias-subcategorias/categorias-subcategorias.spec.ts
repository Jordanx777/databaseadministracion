import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriasSubcategorias } from './categorias-subcategorias';

describe('CategoriasSubcategorias', () => {
  let component: CategoriasSubcategorias;
  let fixture: ComponentFixture<CategoriasSubcategorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasSubcategorias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriasSubcategorias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
