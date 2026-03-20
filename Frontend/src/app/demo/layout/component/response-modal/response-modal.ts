import {
  Component, OnInit, OnDestroy,
  ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ModalResponseService, ModalData } from 'src/app/@theme/services/modal-response.service';

@Component({
  selector: 'app-response-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './response-modal.html',
  styleUrls: ['./response-modal.scss'],
  changeDetection: ChangeDetectionStrategy.Default  // ✅ Asegura detección normal
})
export class ResponseModalComponent implements OnInit, OnDestroy {
  visible = false;
  modal: ModalData = { title: '', message: '', type: 'info' };

  private sub!: Subscription;
  private timer: any;

  constructor(
    private modalService: ModalResponseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.modalService.modal$.subscribe(data => {
      clearTimeout(this.timer);
      this.modal   = data;
      this.visible = true;
      this.cdr.markForCheck(); // ✅ markForCheck en lugar de detectChanges

      this.timer = setTimeout(() => this.cerrar(), 4000);
    });
  }

  cerrar(): void {
    this.visible = false;
    this.cdr.markForCheck(); // ✅
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearTimeout(this.timer);
  }
}