import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarProveedoresComponent } from './agregar-proveedores-component';

describe('AgregarProveedoresComponent', () => {
  let component: AgregarProveedoresComponent;
  let fixture: ComponentFixture<AgregarProveedoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarProveedoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarProveedoresComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
