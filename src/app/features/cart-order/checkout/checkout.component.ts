import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OrderApiService } from '../services/order-api.service';
import { PlaceOrderRequest, PlaceOrderItemRequest } from '../models/order.models';

@Component({
  selector: 'checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  cartItems: PlaceOrderItemRequest[] = [];
  selectedPickupSlot: string = '';
  totalAmount: number = 0;
  isLoading: boolean = false;
  errorMessage: string = '';
  private destroy$ = new Subject<void>();

  pickupSlots = [
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '12:30 PM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
  ];

  constructor(
    private orderApi: OrderApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.warn('No JWT found — redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Mock cart data - replace with real cart service later
    this.cartItems = [
      { menuItemId: 101, quantity: 2 },
      { menuItemId: 201, quantity: 1 },
    ];
    this.calculateTotal();
  }

  private calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce((sum, item) => sum + (item.quantity * 50), 0);
  }

  onPlaceOrder(): void {
    if (!this.selectedPickupSlot) {
      this.errorMessage = 'Please select a pickup time';
      return;
    }

    if (this.cartItems.length === 0) {
      this.errorMessage = 'Your cart is empty';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const request: PlaceOrderRequest = {
      pickupSlot: this.selectedPickupSlot,
      items: this.cartItems,
    };

    this.orderApi
      .placeOrder(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Order placed:', response);
          this.router.navigate(['/orders', response.orderId]);
        },
        error: (error) => {
          console.error('❌ Full Error Response:', error);
          console.error('   Status:', error.status);
          console.error('   Message:', error.error?.message);
          console.error('   Error:', error.error);

          const statusMessage = error.status === 401
            ? 'Unauthorized - Token issue or user not found'
            : error.error?.message || 'Failed to place order. Please try again.';

          this.errorMessage = statusMessage;
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
