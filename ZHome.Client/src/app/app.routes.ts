import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LandingComponent } from './views/landing/landing';
import { LoginComponent } from './views/auth/login';
import { RegisterComponent } from './views/auth/register';
import { LandlordOverviewComponent } from './views/landlord/overview';
import { LandlordPropertiesComponent } from './views/landlord/properties';
import { LandlordUtilityGridComponent } from './views/landlord/utility-grid';
import { LandlordBillsComponent } from './views/landlord/bills';
import { TenantBillsComponent } from './views/tenant/bills';
import { TenantMatchComponent } from './views/tenant/match';
import { MyRentalComponent } from './views/tenant/my-rental';
import { BillPrintComponent } from './views/public/bill-print';
import { AdminVerificationsComponent } from './views/admin/verifications';
import { ProfileComponent } from './views/auth/profile';
import { LandlordReportsComponent } from './views/landlord/reports';
import { LandlordPackagesComponent } from './views/landlord/packages';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'bill-print/:id', component: BillPrintComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  
  // Admin protected routes
  {
    path: 'admin/verifications',
    component: AdminVerificationsComponent,
    canActivate: [authGuard],
    data: { roles: ['Administrator'] }
  },
  
  // Landlord protected routes
  { 
    path: 'landlord/overview', 
    component: LandlordOverviewComponent,
    canActivate: [authGuard],
    data: { roles: ['Landlord', 'Administrator'] }
  },
  { 
    path: 'landlord/properties', 
    component: LandlordPropertiesComponent,
    canActivate: [authGuard],
    data: { roles: ['Landlord', 'Administrator'] }
  },
  { 
    path: 'landlord/utility-grid', 
    component: LandlordUtilityGridComponent,
    canActivate: [authGuard],
    data: { roles: ['Landlord', 'Administrator'] }
  },
  { 
    path: 'landlord/bills', 
    component: LandlordBillsComponent,
    canActivate: [authGuard],
    data: { roles: ['Landlord', 'Administrator'] }
  },
  { 
    path: 'landlord/reports', 
    component: LandlordReportsComponent,
    canActivate: [authGuard],
    data: { roles: ['Landlord', 'Administrator'] }
  },
  { 
    path: 'landlord/packages', 
    component: LandlordPackagesComponent,
    canActivate: [authGuard],
    data: { roles: ['Landlord', 'Administrator'] }
  },

  // Tenant protected routes
  { 
    path: 'tenant/my-rental', 
    component: MyRentalComponent,
    canActivate: [authGuard],
    data: { roles: ['Tenant'] }
  },
  { 
    path: 'tenant/bills', 
    component: TenantBillsComponent,
    canActivate: [authGuard],
    data: { roles: ['Tenant'] }
  },
  { 
    path: 'tenant/match', 
    component: TenantMatchComponent,
    canActivate: [authGuard],
    data: { roles: ['Tenant'] }
  },

  // Wildcard redirect
  { path: '**', redirectTo: '' }
];
