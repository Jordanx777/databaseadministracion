import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoProductComponent } from './catalogo-product-component';

describe('CatalogoProductComponent', () => {
  let component: CatalogoProductComponent;
  let fixture: ComponentFixture<CatalogoProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoProductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogoProductComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
