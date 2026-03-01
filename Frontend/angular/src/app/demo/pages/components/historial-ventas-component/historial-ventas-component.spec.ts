import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialVentasComponent } from './historial-ventas-component';

describe('HistorialVentasComponent', () => {
  let component: HistorialVentasComponent;
  let fixture: ComponentFixture<HistorialVentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialVentasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialVentasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
