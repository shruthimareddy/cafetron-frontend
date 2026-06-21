import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OrderApiService } from '../services/order-api.service';
import { PlaceOrderRequest } from '../models/order.models';
import { CartItem, CartService } from '../services/cart.service';
import { WalletService } from '../../wallet/wallet.service';
import { TimeZoneOption, TimeZoneService } from '../services/timezone.service';

@Component({
  selector: 'checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  selectedPickupSlot: string = '';
  selectedTimeZone = 'Asia/Kolkata';
  pickupLocation = 'Cafetron cafeteria counter';
  timeZoneOptions: TimeZoneOption[] = [];
  totalAmount: number = 0;
  walletBalance: number | null = null;
  isLoading: boolean = false;
  isWalletLoading: boolean = false;
  errorMessage: string = '';
  toastMessage: string = '';
  toastType: 'error' | 'success' = 'error';
  checkoutView: 'cards' | 'overview' = 'cards';
  activeStep = 0;
  private destroy$ = new Subject<void>();
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private slotAvailabilityTimerId: ReturnType<typeof setInterval> | null = null;
  private readonly cafeteriaTimeZone = 'Asia/Kolkata';
  private readonly minPickupLeadMinutes = 30;
  private readonly timezoneStorageKey = 'cafetron_timezone';
  private readonly locationStorageKey = 'cafetron_pickup_location';
  private readonly basePickupSlots = [
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
  ];

  private readonly defaultTimeZoneOptions = [
    'Asia/Kolkata',
    'UTC',
    'Asia/Dubai',
    'Asia/Singapore',
    'Europe/London',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Australia/Sydney',
  ];

  checkoutSteps = [
    { label: 'Time slot', icon: 'schedule' },
    { label: 'Preview food', icon: 'restaurant' },
    { label: 'Payment', icon: 'payments' },
    { label: 'Place order', icon: 'receipt_long' },
  ];

  pickupSlots = this.basePickupSlots;

  constructor(
    private orderApi: OrderApiService,
    private cartService: CartService,
    private walletService: WalletService,
    private timeZoneService: TimeZoneService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeTimeZone();

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.warn('No JWT found — redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.cartItems = items;
        this.calculateTotal();
      });

    this.loadWalletBalance();
    this.slotAvailabilityTimerId = setInterval(() => {
      if (this.selectedPickupSlot && !this.isPickupSlotAvailable(this.selectedPickupSlot)) {
        this.selectedPickupSlot = '';
        this.showToast(`Selected pickup time expired. Choose a slot at least ${this.minPickupLeadMinutes} minutes from now.`, 'error');
      }
    }, 30000);
  }

  private calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  private loadWalletBalance(): void {
    this.isWalletLoading = true;

    this.walletService
      .getWallet()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (wallet) => {
          this.walletBalance = wallet.balance;
          this.isWalletLoading = false;
        },
        error: (error) => {
          console.error('Failed to load wallet:', error);
          this.walletBalance = null;
          this.isWalletLoading = false;
        },
      });
  }

  getWalletLabel(): string {
    if (this.isWalletLoading) {
      return 'Loading...';
    }

    return this.walletBalance === null
      ? 'Unavailable'
      : `₹${this.walletBalance.toFixed(2)}`;
  }

  getLineTotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  getCartInitial(item: CartItem): string {
    return item.itemName?.trim().charAt(0).toUpperCase() || String(item.menuItemId);
  }

  setCheckoutView(view: 'cards' | 'overview'): void {
    this.checkoutView = view;
  }

  onTimeZoneChange(timeZone: string): void {
    this.selectedTimeZone = timeZone;
    localStorage.setItem(this.timezoneStorageKey, timeZone);
  }

  onLocationChange(location: string): void {
    this.pickupLocation = location;
    localStorage.setItem(this.locationStorageKey, location);
  }

  getTimeZoneLabel(timeZone: string): string {
    const option = this.timeZoneOptions.find((item) => item.id === timeZone);
    return option ? `${option.label} (${option.offset})` : timeZone.replace(/_/g, ' ');
  }

  getPickupSlotLabel(slot: string): string {
    return this.formatPickupSlot(slot, this.selectedTimeZone);
  }

  getPickupSlotCaption(slot: string): string {
    if (!this.isPickupSlotAvailable(slot)) {
      return this.isPickupSlotPast(slot) ? 'Passed' : '30 min minimum';
    }

    return slot === this.getFirstAvailablePickupSlot() ? 'Fastest' : this.getTimeZoneShortName(this.selectedTimeZone);
  }

  selectPickupSlot(slot: string): void {
    if (!this.isPickupSlotAvailable(slot)) {
      this.showToast(this.getInvalidPickupSlotMessage(slot), 'error');
      return;
    }

    this.selectedPickupSlot = slot;
  }

  hasAvailablePickupSlots(): boolean {
    return this.pickupSlots.some((slot) => this.isPickupSlotAvailable(slot));
  }

  isPickupSlotAvailable(slot: string): boolean {
    return this.getPickupSlotDate(slot).getTime() >= Date.now() + this.minPickupLeadMinutes * 60 * 1000;
  }

  goToStep(index: number): void {
    if (index > 0 && !this.hasValidPickupSlotSelected()) {
      this.showToast(this.getPickupSlotRequiredMessage(), 'error');
      return;
    }

    this.activeStep = Math.max(0, Math.min(index, this.checkoutSteps.length - 1));
  }

  nextStep(): void {
    if (this.activeStep === 0 && !this.hasValidPickupSlotSelected()) {
      this.showToast(this.getPickupSlotRequiredMessage(), 'error');
      return;
    }

    this.goToStep(this.activeStep + 1);
  }

  previousStep(): void {
    this.goToStep(this.activeStep - 1);
  }

  onPlaceOrder(): void {
    if (!this.hasValidPickupSlotSelected()) {
      this.showToast(this.getPickupSlotRequiredMessage(), 'error');
      return;
    }

    if (this.cartItems.length === 0) {
      this.showToast('Your cart is empty', 'error');
      return;
    }

    if (!this.pickupLocation.trim()) {
      this.showToast('Please enter a pickup location', 'error');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const request: PlaceOrderRequest = {
      pickupSlot: `${this.getPickupSlotLabel(this.selectedPickupSlot)} ${this.getTimeZoneShortName(this.selectedTimeZone)}`,
      pickupSlotTime: this.selectedPickupSlot,
      location: this.pickupLocation.trim(),
      pickupTimeZone: this.selectedTimeZone,
      items: this.cartService.toPlaceOrderItems(),
    };

    this.orderApi
      .placeOrder(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Order placed:', response);
          this.cartService.clearCart();
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
          this.showToast(statusMessage, 'error');
          this.isLoading = false;
        },
      });
  }

  private showToast(message: string, type: 'error' | 'success'): void {
    this.errorMessage = type === 'error' ? message : this.errorMessage;
    this.toastMessage = message;
    this.toastType = type;

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }

    this.toastTimeoutId = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimeoutId = null;
    }, 4200);
  }

  private initializeTimeZone(): void {
    const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || this.cafeteriaTimeZone;
    const storedTimeZone = localStorage.getItem(this.timezoneStorageKey);
    const storedLocation = localStorage.getItem(this.locationStorageKey);
    const initialTimeZone = this.isValidTimeZone(storedTimeZone)
      ? storedTimeZone as string
      : detectedTimeZone;

    this.pickupLocation = storedLocation?.trim() || this.pickupLocation;
    this.timeZoneOptions = this.toTimeZoneOptions([initialTimeZone, detectedTimeZone, ...this.defaultTimeZoneOptions]);
    this.selectedTimeZone = initialTimeZone;
    this.loadTimeZoneOptions(initialTimeZone, detectedTimeZone);
  }

  private loadTimeZoneOptions(initialTimeZone: string, detectedTimeZone: string): void {
    this.timeZoneService
      .getTimeZones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (options) => {
          const apiOptions = options.filter((option) => this.isValidTimeZone(option.id));
          const localOptions = this.toTimeZoneOptions([initialTimeZone, detectedTimeZone]);
          const optionMap = new Map<string, TimeZoneOption>();

          [...localOptions, ...apiOptions].forEach((option) => optionMap.set(option.id, option));
          this.timeZoneOptions = Array.from(optionMap.values());
        },
        error: (error) => {
          console.warn('Failed to load timezone API options; using local fallback.', error);
        }
      });
  }

  private toTimeZoneOptions(timeZones: string[]): TimeZoneOption[] {
    return Array.from(new Set(timeZones))
      .filter((timeZone): timeZone is string => this.isValidTimeZone(timeZone))
      .map((timeZone) => ({
        id: timeZone,
        label: timeZone.replace(/_/g, ' '),
        offset: this.getTimeZoneShortName(timeZone)
      }));
  }

  private isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
    if (!timeZone) {
      return false;
    }

    try {
      Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
      return true;
    } catch {
      return false;
    }
  }

  private formatPickupSlot(slot: string, timeZone: string): string {
    const slotDate = this.getPickupSlotDate(slot);

    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone,
    }).format(slotDate);
  }

  private hasValidPickupSlotSelected(): boolean {
    return !!this.selectedPickupSlot && this.isPickupSlotAvailable(this.selectedPickupSlot);
  }

  private getPickupSlotRequiredMessage(): string {
    if (!this.selectedPickupSlot) {
      return `Please select a pickup time at least ${this.minPickupLeadMinutes} minutes from now`;
    }

    return this.getInvalidPickupSlotMessage(this.selectedPickupSlot);
  }

  private getInvalidPickupSlotMessage(slot: string): string {
    if (this.isPickupSlotPast(slot)) {
      return 'That pickup time has already passed. Please choose a later slot.';
    }

    return `Pickup time must be at least ${this.minPickupLeadMinutes} minutes from now`;
  }

  private getFirstAvailablePickupSlot(): string {
    return this.pickupSlots.find((slot) => this.isPickupSlotAvailable(slot)) || '';
  }

  private isPickupSlotPast(slot: string): boolean {
    return this.getPickupSlotDate(slot).getTime() < Date.now();
  }

  private getPickupSlotDate(slot: string): Date {
    const [hour, minute] = slot.split(':').map(Number);
    const cafeteriaDate = this.getTodayInTimeZone(this.cafeteriaTimeZone);

    return this.getDateForZonedTime(
      this.cafeteriaTimeZone,
      cafeteriaDate.year,
      cafeteriaDate.month,
      cafeteriaDate.day,
      hour,
      minute
    );
  }

  private getTimeZoneShortName(timeZone: string): string {
    const formattedParts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(new Date());

    return formattedParts.find((part) => part.type === 'timeZoneName')?.value || timeZone;
  }

  private getTodayInTimeZone(timeZone: string): { year: number; month: number; day: number } {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    return {
      year: Number(parts.find((part) => part.type === 'year')?.value),
      month: Number(parts.find((part) => part.type === 'month')?.value),
      day: Number(parts.find((part) => part.type === 'day')?.value),
    };
  }

  private getDateForZonedTime(
    timeZone: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number
  ): Date {
    const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
    const firstOffset = this.getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
    const firstDate = new Date(utcGuess - firstOffset);
    const secondOffset = this.getTimeZoneOffsetMs(firstDate, timeZone);

    return new Date(utcGuess - secondOffset);
  }

  private getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);

    const value = (type: string): number => Number(parts.find((part) => part.type === type)?.value);
    const asUtc = Date.UTC(
      value('year'),
      value('month') - 1,
      value('day'),
      value('hour'),
      value('minute'),
      value('second')
    );

    return asUtc - date.getTime();
  }

  ngOnDestroy(): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    if (this.slotAvailabilityTimerId) {
      clearInterval(this.slotAvailabilityTimerId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
