import { Component } from '@angular/core';
import { Route, Routes } from '@angular/router';

// Cart-Order Components
import { CheckoutComponent } from './features/cart-order/checkout/checkout.component';
import { OrderHistoryComponent } from './features/cart-order/order-history/order-history.component';
import { OrderDetailComponent } from './features/cart-order/order-history/order-detail/order-detail.component';
import { MenuBrowseComponent } from './features/menu/menu-browse/menu-browse.component';

// Menu Management Components
import { MenuManageComponent } from './features/menu/menu-manage/menu-manage.component';

// Vendor Management Components
import { VendorManageComponent } from './features/vendor/vendor-manage/vendor-manage.component';

// import { APP_ROLES, AppRole, roleGuard } from './core/guards/role.guard';
// import { authGuard } from './core/guards/auth.guard';

@Component({
  standalone: true,
  template: '',
})
class PendingFeatureRouteComponent {}

type FeatureRouteOptions = {
  path: string;
  title: string;
  // roles: AppRole[];
  componentPath: string;
};

const featureRoute = ({
  path,
  title,
  // roles,
  componentPath,
}: FeatureRouteOptions): Route => ({
  path,
  title,
  // canActivate: [authGuard, roleGuard],
  component: PendingFeatureRouteComponent,
  data: {
    // roles,
    componentPath,
  },
});

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'menu',
  },
  {
    path: 'login',
    title: 'Login',
    component: PendingFeatureRouteComponent,
    data: {
      componentPath: 'features/auth/login/login.component',
    },
  },
  featureRoute({
    path: 'menu',
    title: 'Menu',
    // roles: [APP_ROLES.employee, APP_ROLES.counter, APP_ROLES.admin],
    componentPath: 'features/menu/menu-browse/menu-browse.component',
  }),
  {
    path: 'menu/manage',
    title: 'Manage Menu',
    component: MenuManageComponent,
  },
  featureRoute({
    path: 'cart',
    title: 'Cart',
    // roles: [APP_ROLES.employee],
    componentPath: 'features/cart-order/cart/cart.component',
  }),
  {
    path: 'checkout',
    title: 'Checkout',
    component: CheckoutComponent,
  },
  {
    path: 'orders',
    title: 'Order History',
    component: OrderHistoryComponent,
  },
  {
    path: 'orders/:orderId',
    title: 'Order Detail',
    component: OrderDetailComponent,
  },
  featureRoute({
    path: 'wallet',
    title: 'Wallet',
    // roles: [APP_ROLES.employee],
    componentPath: 'features/wallet/wallet/wallet.component',
  }),
  {
    path: 'pickup',
    pathMatch: 'full',
    redirectTo: 'pickup/qr',
  },
  featureRoute({
    path: 'pickup/qr',
    title: 'Pickup QR',
    // roles: [APP_ROLES.employee],
    componentPath: 'features/pickup-scanner/qr-view/qr-view.component',
  }),
  {
    path: 'counter',
    pathMatch: 'full',
    redirectTo: 'counter/scanner',
  },
  featureRoute({
    path: 'counter/scanner',
    title: 'Counter Scanner',
    // roles: [APP_ROLES.counter, APP_ROLES.admin],
    componentPath: 'features/pickup-scanner/scanner/scanner.component',
  }),
  featureRoute({
    path: 'counter/queue',
    title: 'Pickup Queue',
    // roles: [APP_ROLES.counter, APP_ROLES.admin],
    componentPath: 'features/pickup-scanner/queue/queue.component',
  }),
  {
    path: 'admin',
    pathMatch: 'full',
    redirectTo: 'admin/dashboard',
  },
  {
    path: 'admin/dashboard',
    title: 'Admin Dashboard',
    loadComponent: () =>
    import('./features/admin/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
    // roles: [APP_ROLES.admin],
    // componentPath: 'features/admin/dashboard/dashboard.component',
  },
  {
    path: 'admin/operations',
    title: 'Operations',
    loadComponent: () =>
    import('./features/admin/operations/operations.component')
      .then(m => m.OperationsComponent)
    // roles: [APP_ROLES.admin],
    // componentPath: 'features/admin/operations/operations.component',
  },
  {
    path: 'admin/vendors',
    title: 'Manage Vendors',
    component: VendorManageComponent,
  },
  {
    path: 'test/menu',
    component: MenuBrowseComponent,
  },
  {
    path: '**',
    redirectTo: 'menu',
  },
];
