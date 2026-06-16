export interface MenuItemResponse {
  id: number;
  itemName: string;
  price: number;
  stock: number;
  foodType: string;
  isAvailable: boolean;
  vendorId: number;
  vendorName: string;
}

export interface MenuItemRequest {
  itemName: string;
  price: number;
  stock: number;
  foodType: string;
  vendorId: number;
}
