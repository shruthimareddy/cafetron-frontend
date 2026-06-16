import { Component } from '@angular/core';
import { Route, Routes } from '@angular/router';

// Cart-Order Components
import { CheckoutComponent } from './features/cart-order/checkout/checkout.component';
import { OrderHistoryComponent } from './features/cart-order/order-history/order-history.component';
import { OrderDetailComponent } from './features/cart-order/order-history/order-detail/order-detail.component';

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
  componentPath: string;
};

const featureRoute = ({
  path,
  title,
  componentPath,
}: FeatureRouteOptions): Route => ({
  path,
  title,
  canActivate: [authGuard],
  component: PendingFeatureRouteComponent,
  data: {
    componentPath,
  },
});

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',        // ← changed from 'menu' to 'login'
  },

  // ── YOUR ROUTES (auth) ──────────────────────────────────────────
  {
    path: 'login',
    title: 'Login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Register',
    loadComponent: () =>
      import('./features/auth/register/register')
        .then(m => m.RegisterComponent),
  },

  // ── TEAMMATES' ROUTES (unchanged, just added authGuard) ─────────
  featureRoute({
    path: 'menu',
    title: 'Menu',
    componentPath: 'features/menu/menu-browse/menu-browse.component',
  }),
  featureRoute({
    path: 'menu/manage',
    title: 'Manage Menu',
    componentPath: 'features/menu/menu-manage/menu-manage.component',
  }),
  featureRoute({
    path: 'cart',
    title: 'Cart',
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
    componentPath: 'features/pickup-scanner/scanner/scanner.component',
  }),
  featureRoute({
    path: 'counter/queue',
    title: 'Pickup Queue',
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
    path: '**',
    redirectTo: 'login',        // ← changed from 'menu' to 'login'
  },
];