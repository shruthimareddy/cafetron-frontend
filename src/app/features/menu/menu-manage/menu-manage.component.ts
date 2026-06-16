import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';

import { MenuManagementService } from '../services/menu-management.service';
import { VendorManagementService } from '../../vendor/services/vendor-management.service';
import { MenuItemResponse } from '../models/menu-management.models';
import { VendorResponse } from '../../vendor/models/vendor-management.models';
import { MenuItemFormComponent } from './menu-item-form/menu-item-form.component';

@Component({
  selector: 'menu-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MenuItemFormComponent],
  templateUrl: './menu-manage.component.html',
  styleUrl: './menu-manage.component.css',
})
export class MenuManageComponent implements OnInit, OnDestroy {
  items: MenuItemResponse[] = [];
  filteredItems: MenuItemResponse[] = [];
  vendors: VendorResponse[] = [];

  isLoading = true;
  errorMessage = '';
  showForm = false;
  selectedItem: MenuItemResponse | null = null;

  filterVendorId: number | null = null;
  filterAvailable: string = 'all';

  toast = '';
  toastType: 'success' | 'error' = 'success';

  private destroy$ = new Subject<void>();

  constructor(
    private menuService: MenuManagementService,
    private vendorService: VendorManagementService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    Promise.all([
      this.menuService.getAll().pipe(timeout(10000), takeUntil(this.destroy$)).toPromise(),
      this.vendorService.getAll().pipe(timeout(10000), takeUntil(this.destroy$)).toPromise(),
    ])
      .then(([items, vendors]) => {
        this.items = items || [];
        this.vendors = vendors || [];
        this.applyFilters();
      })
      .catch((error) => {
        console.error('Error loading data:', error);
        this.errorMessage =
          error.name === 'TimeoutError'
            ? 'Data took too long to load. Please check that the backend is running.'
            : 'Failed to load menu items. Please try again.';
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  applyFilters(): void {
    this.filteredItems = this.items.filter((item) => {
      const vendorMatch = !this.filterVendorId || item.vendorId === this.filterVendorId;
      const availabilityMatch =
        this.filterAvailable === 'all' ||
        (this.filterAvailable === 'available' && item.isAvailable) ||
        (this.filterAvailable === 'unavailable' && !item.isAvailable);
      return vendorMatch && availabilityMatch;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openCreateForm(): void {
    this.selectedItem = null;
    this.showForm = true;
  }

  openEditForm(item: MenuItemResponse): void {
    this.selectedItem = item;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.selectedItem = null;
  }

  onFormSave(): void {
    this.closeForm();
    this.loadData();
    this.showToast('Menu item saved successfully', 'success');
  }

  deleteItem(item: MenuItemResponse): void {
    if (!confirm(`Delete "${item.itemName}"?`)) return;

    this.menuService
      .delete(item.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.items = this.items.filter((i) => i.id !== item.id);
          this.applyFilters();
          this.showToast('Menu item deleted', 'success');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.showToast('Failed to delete menu item', 'error');
        },
      });
  }

  toggleAvailability(item: MenuItemResponse): void {
    this.menuService
      .toggleAvailability(item.id, !item.isAvailable)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          const index = this.items.findIndex((i) => i.id === item.id);
          if (index >= 0) {
            this.items[index] = updated;
            this.applyFilters();
          }
          this.showToast(
            `Item marked as ${updated.isAvailable ? 'available' : 'unavailable'}`,
            'success'
          );
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Toggle error:', error);
          this.showToast('Failed to update availability', 'error');
        },
      });
  }

  getStatusClass(isAvailable: boolean): string {
    return isAvailable ? 'status-available' : 'status-unavailable';
  }

  getVendorName(vendorId: number): string {
    return this.vendors.find((v) => v.id === vendorId)?.name || 'Unknown Vendor';
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
