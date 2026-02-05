import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarVentasComponent } from './agregar-ventas-component';

describe('AgregarVentasComponent', () => {
  let component: AgregarVentasComponent;
  let fixture: ComponentFixture<AgregarVentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarVentasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarVentasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
