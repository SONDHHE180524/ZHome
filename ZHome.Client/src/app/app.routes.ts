import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public Landing Page (Lazy-loaded)
  { 
    path: '', 
    loadComponent: () => import('./views/landing/landing').then(m => m.LandingComponent) 
  },
  { 
    path: 'phong-tro', 
    loadComponent: () => import('./views/landing/landing').then(m => m.LandingComponent) 
  },
  { 
    path: 'phong-tro-detail/:id', 
    loadComponent: () => import('./views/public/property-detail').then(m => m.PropertyDetailComponent) 
  },
  { 
    path: 'phong-tro/:id', 
    loadComponent: () => import('./views/public/property-detail').then(m => m.PropertyDetailComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./views/auth/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./views/auth/register').then(m => m.RegisterComponent) 
  },
  { 
    path: 'packages', 
    loadComponent: () => import('./views/landlord/packages').then(m => m.LandlordPackagesComponent) 
  },
  { 
    path: 'bill-print/:id', 
    loadComponent: () => import('./views/public/bill-print').then(m => m.BillPrintComponent) 
  },
  { 
    path: 'contract-print/:id', 
    loadComponent: () => import('./views/public/contract-print').then(m => m.ContractPrintComponent) 
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./views/auth/profile').then(m => m.ProfileComponent), 
    canActivate: [authGuard] 
  },
  
  // Admin protected routes with persistent Dashboard sidebar layout
  {
    path: 'admin',
    loadComponent: () => import('./views/admin/layout').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    data: { roles: ['Administrator'] },
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./views/admin/dashboard').then(m => m.AdminDashboardComponent) 
      },
      { 
        path: 'users', 
        loadComponent: () => import('./views/admin/users').then(m => m.AdminUsersComponent) 
      },
      { 
        path: 'properties', 
        loadComponent: () => import('./views/admin/properties').then(m => m.AdminPropertiesComponent) 
      },
      { 
        path: 'verifications', 
        loadComponent: () => import('./views/admin/verifications').then(m => m.AdminVerificationsComponent) 
      },
      { 
        path: 'transactions', 
        loadComponent: () => import('./views/admin/transactions').then(m => m.AdminTransactionsComponent) 
      },
      { 
        path: 'activity-logs', 
        loadComponent: () => import('./views/admin/activity-logs').then(m => m.AdminActivityLogsComponent) 
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Landlord protected routes with persistent Dashboard layout
  {
    path: 'landlord',
    loadComponent: () => import('./views/landlord/layout').then(m => m.LandlordLayoutComponent),
    canActivate: [authGuard],
    data: { roles: ['Landlord'] },
    children: [
      { 
        path: 'overview', 
        loadComponent: () => import('./views/landlord/overview').then(m => m.LandlordOverviewComponent) 
      },
      { 
        path: 'rooms', 
        loadComponent: () => import('./views/landlord/rooms').then(m => m.LandlordRoomsComponent) 
      },
      { 
        path: 'properties', 
        loadComponent: () => import('./views/landlord/properties').then(m => m.LandlordPropertiesComponent) 
      },
      { 
        path: 'create-property', 
        loadComponent: () => import('./views/landlord/create-property').then(m => m.CreatePropertyComponent) 
      },
      { 
        path: 'utility-grid', 
        loadComponent: () => import('./views/landlord/utility-grid').then(m => m.LandlordUtilityGridComponent) 
      },
      { 
        path: 'contracts', 
        loadComponent: () => import('./views/landlord/contracts').then(m => m.LandlordContractsComponent) 
      },
      { 
        path: 'create-contract', 
        loadComponent: () => import('./views/landlord/create-contract').then(m => m.CreateContractComponent) 
      },
      { 
        path: 'tenants', 
        loadComponent: () => import('./views/landlord/tenants').then(m => m.LandlordTenantsComponent) 
      },
      { 
        path: 'bills', 
        loadComponent: () => import('./views/landlord/bills').then(m => m.LandlordBillsComponent) 
      },
      { 
        path: 'transactions', 
        loadComponent: () => import('./views/landlord/transactions').then(m => m.LandlordTransactionsComponent) 
      },
      { 
        path: 'incidents', 
        loadComponent: () => import('./views/landlord/incidents').then(m => m.LandlordIncidentsComponent) 
      },
      { 
        path: 'reports', 
        loadComponent: () => import('./views/landlord/reports').then(m => m.LandlordReportsComponent) 
      },
      { 
        path: 'packages', 
        loadComponent: () => import('./views/landlord/packages').then(m => m.LandlordPackagesComponent) 
      },
      { path: '', redirectTo: 'overview', pathMatch: 'full' }
    ]
  },

  // Tenant & Public Match routes
  { 
    path: 'ghep-tro', 
    loadComponent: () => import('./views/tenant/match').then(m => m.TenantMatchComponent) 
  },
  { 
    path: 'tenant/match', 
    loadComponent: () => import('./views/tenant/match').then(m => m.TenantMatchComponent) 
  },
  { 
    path: 'tenant/my-rental', 
    loadComponent: () => import('./views/tenant/my-rental').then(m => m.MyRentalComponent),
    canActivate: [authGuard],
    data: { roles: ['Tenant'] }
  },
  { 
    path: 'tenant/bills', 
    loadComponent: () => import('./views/tenant/bills').then(m => m.TenantBillsComponent),
    canActivate: [authGuard],
    data: { roles: ['Tenant'] }
  },

  // Wildcard redirect
  { path: '**', redirectTo: '' }
];
