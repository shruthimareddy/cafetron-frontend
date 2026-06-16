import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';

import { VendorManagementService } from '../services/vendor-management.service';
import { VendorResponse } from '../models/vendor-management.models';
import { VendorFormComponent } from './vendor-form/vendor-form.component';

@Component({
  selector: 'vendor-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, VendorFormComponent],
  templateUrl: './vendor-manage.component.html',
  styleUrl: './vendor-manage.component.css',
})
export class VendorManageComponent implements OnInit, OnDestroy {
  vendors: VendorResponse[] = [];
  filteredVendors: VendorResponse[] = [];

  isLoading = true;
  errorMessage = '';
  showForm = false;
  selectedVendor: VendorResponse | null = null;

  filterStatus: string = 'all';

  toast = '';
  toastType: 'success' | 'error' = 'success';

  private destroy$ = new Subject<void>();

  constructor(
    private vendorService: VendorManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVendors();
  }

  private loadVendors(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.vendorService
      .getAll()
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (vendors) => {
          this.vendors = vendors;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading vendors:', error);
          this.vendors = [];
          this.errorMessage =
            error.name === 'TimeoutError'
              ? 'Vendors took too long to load. Please check that the backend is running.'
              : error.error?.message || 'Failed to load vendors. Please try again.';
        },
      });
  }

  applyFilters(): void {
    this.filteredVendors = this.vendors.filter((vendor) => {
      if (this.filterStatus === 'active') return vendor.isActive;
      if (this.filterStatus === 'inactive') return !vendor.isActive;
      return true;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openCreateForm(): void {
    this.selectedVendor = null;
    this.showForm = true;
  }

  openEditForm(vendor: VendorResponse): void {
    this.selectedVendor = vendor;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.selectedVendor = null;
  }

  onFormSave(): void {
    this.closeForm();
    this.loadVendors();
    this.showToast('Vendor saved successfully', 'success');
  }

  deleteVendor(vendor: VendorResponse): void {
    if (!confirm(`Delete vendor "${vendor.name}"? This action cannot be undone.`)) return;

    this.vendorService
      .delete(vendor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.vendors = this.vendors.filter((v) => v.id !== vendor.id);
          this.applyFilters();
          this.showToast('Vendor deleted', 'success');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.showToast('Failed to delete vendor', 'error');
        },
      });
  }

  toggleActive(vendor: VendorResponse): void {
    this.vendorService
      .toggleActive(vendor.id, !vendor.isActive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          const index = this.vendors.findIndex((v) => v.id === vendor.id);
          if (index >= 0) {
            this.vendors[index] = updated;
            this.applyFilters();
          }
          this.showToast(`Vendor marked as ${updated.isActive ? 'active' : 'inactive'}`, 'success');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Toggle error:', error);
          this.showToast('Failed to update vendor status', 'error');
        },
      });
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
