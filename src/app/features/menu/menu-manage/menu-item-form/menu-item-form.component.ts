import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuManagementService } from '../../services/menu-management.service';
import { MenuItemResponse, MenuItemRequest } from '../../models/menu-management.models';
import { VendorResponse } from '../../../vendor/models/vendor-management.models';

@Component({
  selector: 'menu-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-item-form.component.html',
  styleUrl: './menu-item-form.component.css',
})
export class MenuItemFormComponent implements OnInit {
  @Input() item: MenuItemResponse | null = null;
  @Input() vendors: VendorResponse[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  itemName = '';
  price: number | null = null;
  stock: number | null = null;
  foodType = '';
  vendorId: number | null = null;

  errorMessage = '';
  isSaving = false;

  constructor(
    private menuService: MenuManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.item) {
      this.itemName = this.item.itemName;
      this.price = this.item.price;
      this.stock = this.item.stock;
      this.foodType = this.item.foodType;
      this.vendorId = this.item.vendorId;
    }
  }

  isFormValid(): boolean {
    return !!(
      this.itemName.trim() &&
      this.price !== null &&
      this.price > 0 &&
      this.stock !== null &&
      this.stock >= 0 &&
      this.foodType.trim() &&
      this.vendorId !== null
    );
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.errorMessage = '';
    this.isSaving = true;
    this.cdr.detectChanges();

    const request: MenuItemRequest = {
      itemName: this.itemName,
      price: this.price!,
      stock: this.stock!,
      foodType: this.foodType,
      vendorId: this.vendorId!,
    };

    const operation$ = this.item
      ? this.menuService.update(this.item.id, request)
      : this.menuService.create(request);

    operation$.subscribe({
      next: () => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.save.emit();
      },
      error: (error) => {
        console.error('Error saving menu item:', error);
        this.errorMessage =
          error.error?.message || 'Failed to save menu item. Please try again.';
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}
