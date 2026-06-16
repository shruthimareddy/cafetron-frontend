import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendorManagementService } from '../../services/vendor-management.service';
import { VendorResponse, VendorRequest } from '../../models/vendor-management.models';

@Component({
  selector: 'vendor-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendor-form.component.html',
  styleUrl: './vendor-form.component.css',
})
export class VendorFormComponent implements OnInit {
  @Input() vendor: VendorResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  name = '';
  email = '';
  phone = '';
  contactPerson = '';

  errorMessage = '';
  isSaving = false;

  constructor(
    private vendorService: VendorManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.vendor) {
      this.name = this.vendor.name;
      this.email = this.vendor.email;
      this.phone = this.vendor.phone || '';
      this.contactPerson = this.vendor.contactPerson || '';
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isFormValid(): boolean {
    return !!(
      this.name.trim() &&
      this.email.trim() &&
      this.isValidEmail(this.email)
    );
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.errorMessage = '';
    this.isSaving = true;
    this.cdr.detectChanges();

    const request: VendorRequest = {
      name: this.name,
      email: this.email,
      phone: this.phone || undefined,
      contactPerson: this.contactPerson || undefined,
    };

    const operation$ = this.vendor
      ? this.vendorService.update(this.vendor.id, request)
      : this.vendorService.create(request);

    operation$.subscribe({
      next: () => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.save.emit();
      },
      error: (error) => {
        console.error('Error saving vendor:', error);
        this.errorMessage =
          error.error?.message || 'Failed to save vendor. Please try again.';
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}
