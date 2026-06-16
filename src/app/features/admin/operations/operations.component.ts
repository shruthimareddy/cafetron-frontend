import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OperationsService, OpsStatusDTO } from './operations.service';

@Component({
  selector: 'app-operations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.css']
})
export class OperationsComponent implements OnInit, OnDestroy {

  status: OpsStatusDTO | null = null;
  newCutoffTime = '';
  toggling = false;
  saving = false;
  toast = '';
  toastType: 'success' | 'error' = 'success';

  private pollSub?: Subscription;

  constructor(
    private opsService: OperationsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchStatus();
    this.pollSub = interval(15000)
      .pipe(switchMap(() => this.opsService.getConfig()))
      .subscribe(s => {
        this.status = s;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  fetchStatus(): void {
    this.opsService.getConfig().subscribe(s => {
      this.status = s;
      // Input type="time" always needs HH:mm (24hr) internally
      // but we display in 12hr format in the template
      this.newCutoffTime = s.cutoffTime;
      this.cdr.detectChanges();
    });
  }

  toggleWindow(): void {
    this.toggling = true;
    this.opsService.toggleWindow().subscribe({
      next: s => {
        this.status = { ...s };
        this.toggling = false;
        this.showToast(
          `Ordering window ${s.windowOpen ? 'opened' : 'closed'}`,
          'success'
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.toggling = false;
        this.showToast('Failed to toggle window', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  saveCutoff(): void {
    if (!this.newCutoffTime) return;
    this.saving = true;
    this.cdr.detectChanges();

    this.opsService.updateCutoff(this.newCutoffTime).subscribe({
      next: s => {
        this.status = { ...s };
        this.newCutoffTime = s.cutoffTime;
        this.saving = false;
        this.showToast(`Cutoff updated to ${this.to12hr(s.cutoffTime)}`, 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.showToast('Failed to update cutoff', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  get orderingAllowed(): boolean {
    return !!this.status?.windowOpen && !this.status?.cutoffPassed;
  }

  /**
   * Converts "HH:mm" (24hr) to "hh:mm AM/PM" (12hr) for display.
   * The backend always stores and returns 24hr format.
   * The HTML time input always works in 24hr format internally.
   * We only convert for display in the template.
   */
  to12hr(time24: string): string {
    if (!time24) return '';
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = msg;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toast = '';
      this.cdr.detectChanges();
    }, 3000);
  }
}