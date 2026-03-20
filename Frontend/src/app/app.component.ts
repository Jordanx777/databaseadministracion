// angular import
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, RouterModule } from '@angular/router';
// project import
import { SharedModule } from './demo/shared/shared.module';
// import { ResponseModalComponent } from 'src/app/demo/layout/component/response-modal/response-modal';

@Component({
  selector: 'app-root',
  imports: [SharedModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private router = inject(Router);
  private cdr    = inject(ChangeDetectorRef); //  Necesario para evitar NG0100

  // public props
  isSpinnerVisible = true;

  constructor() {
    this.router.events.subscribe(
      (event) => {
        if (event instanceof NavigationStart) {
          this.isSpinnerVisible = true;
        } else if (
          event instanceof NavigationEnd   ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.isSpinnerVisible = false;
        }
        //  Notificar a Angular del cambio para evitar NG0100
        this.cdr.detectChanges();
      },
      () => {
        this.isSpinnerVisible = false;
        this.cdr.detectChanges();
      }
    );
  }
}