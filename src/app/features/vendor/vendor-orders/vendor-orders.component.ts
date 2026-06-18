import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { VendorOrder, VendorOrdersService } from './vendor-orders.service';

@Component({
  selector: 'app-vendor-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vendor-orders.component.html',
  styleUrl: './vendor-orders.component.css',
})
export class VendorOrdersComponent implements OnInit, OnDestroy {
  orders: VendorOrder[] = [];
  isLoading = true;
  actioningId: number | null = null;
  errorMessage = '';
  toast = '';
  declineReasons: Record<number, string> = {};

  private destroy$ = new Subject<void>();

  constructor(
    private vendorOrdersService: VendorOrdersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.vendorOrdersService
      .getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.orders = orders;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.orders = [];
          this.errorMessage = error?.error?.message || 'Failed to load vendor orders.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  accept(order: VendorOrder): void {
    this.actioningId = order.vendorOrderStatusId;
    this.vendorOrdersService
      .accept(order.vendorOrderStatusId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.afterAction('Order accepted.'),
        error: (error) => this.afterAction(error?.error?.message || 'Failed to accept order.', true),
      });
  }

  decline(order: VendorOrder): void {
    this.actioningId = order.vendorOrderStatusId;
    const reason = this.declineReasons[order.vendorOrderStatusId] || 'Declined by vendor';

    this.vendorOrdersService
      .decline(order.vendorOrderStatusId, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.afterAction('Order declined.'),
        error: (error) => this.afterAction(error?.error?.message || 'Failed to decline order.', true),
      });
  }

  isPending(order: VendorOrder): boolean {
    return order.vendorStatus === 'PENDING' && !this.isOrderCancelled(order);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACCEPTED':
        return 'status-accepted';
      case 'DECLINED':
        return 'status-declined';
      case 'TIMEOUT':
        return 'status-timeout';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }

  getDisplayStatus(order: VendorOrder): string {
    return this.isOrderCancelled(order) ? 'CANCELLED' : order.vendorStatus;
  }

  private isOrderCancelled(order: VendorOrder): boolean {
    return order.orderStatus === 'CANCELLED' || order.vendorStatus === 'CANCELLED';
  }

  private afterAction(message: string, isError = false): void {
    this.toast = message;
    this.errorMessage = isError ? message : '';
    this.actioningId = null;
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
