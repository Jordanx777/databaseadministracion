import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentasDiariasComponent } from './ventas-diarias-component';

describe('VentasDiariasComponent', () => {
  let component: VentasDiariasComponent;
  let fixture: ComponentFixture<VentasDiariasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentasDiariasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentasDiariasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
