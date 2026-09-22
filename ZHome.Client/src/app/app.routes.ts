import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LandingComponent } from './views/landing/landing';
import { LoginComponent } from './views/auth/login';
import { RegisterComponent } from './views/auth/register';
import { LandlordLayoutComponent } from './views/landlord/layout';
import { LandlordOverviewComponent } from './views/landlord/overview';
import { LandlordRoomsComponent } from './views/landlord/rooms';
import { LandlordPropertiesComponent } from './views/landlord/properties';
import { CreatePropertyComponent } from './views/landlord/create-property';
import { LandlordUtilityGridComponent } from './views/landlord/utility-grid';
import { LandlordBillsComponent } from './views/landlord/bills';
import { TenantBillsComponent } from './views/tenant/bills';
import { TenantMatchComponent } from './views/tenant/match';
import { MyRentalComponent } from './views/tenant/my-rental';
import { BillPrintComponent } from './views/public/bill-print';
import { AdminVerificationsComponent } from './views/admin/verifications';
import { AdminDashboardComponent } from './views/admin/dashboard';
import { AdminPropertiesComponent } from './views/admin/properties';
import { AdminTransactionsComponent } from './views/admin/transactions';
import { ProfileComponent } from './views/auth/profile';
import { LandlordReportsComponent } from './views/landlord/reports';
import { LandlordIncidentsComponent } from './views/landlord/incidents';
import { LandlordPackagesComponent } from './views/landlord/packages';
import { LandlordTransactionsComponent } from './views/landlord/transactions';
import { LandlordContractsComponent } from './views/landlord/contracts';
import { CreateContractComponent } from './views/landlord/create-contract';
import { LandlordTenantsComponent } from './views/landlord/tenants';
import { PropertyDetailComponent } from './views/public/property-detail';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'phong-tro-detail/:id', component: PropertyDetailComponent },
  { path: 'phong-tro/:id', component: PropertyDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'bill-print/:id', component: BillPrintComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  
  // Admin protected routes
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['Administrator'] }
  },
  {
    path: 'admin/properties',
    component: AdminPropertiesComponent,
    canActivate: [authGuard],
    data: { roles: ['Administrator'] }
  },
  {
    path: 'admin/verifications',
    component: AdminVerificationsComponent,
    canActivate: [authGuard],
    data: { roles: ['Administrator'] }
  },
  {
    path: 'admin/transactions',
    component: AdminTransactionsComponent,
    canActivate: [authGuard],
    data: { roles: ['Administrator'] }
  },
  
  // Landlord protected routes with persistent Dashboard layout
  {
    path: 'landlord',
    component: LandlordLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['Landlord'] },
    children: [
      { path: 'overview', component: LandlordOverviewComponent },
      { path: 'rooms', component: LandlordRoomsComponent },
      { path: 'properties', component: LandlordPropertiesComponent },
      { path: 'create-property', component: CreatePropertyComponent },
      { path: 'utility-grid', component: LandlordUtilityGridComponent },
      { path: 'contracts', component: LandlordContractsComponent },
      { path: 'create-contract', component: CreateContractComponent },
      { path: 'tenants', component: LandlordTenantsComponent },
      { path: 'bills', component: LandlordBillsComponent },
      { path: 'transactions', component: LandlordTransactionsComponent },
      { path: 'incidents', component: LandlordIncidentsComponent },
      { path: 'reports', component: LandlordReportsComponent },
      { path: 'packages', component: LandlordPackagesComponent },
      { path: '', redirectTo: 'overview', pathMatch: 'full' }
    ]
  },

  // Tenant & Public Match routes
  { path: 'ghep-tro', component: TenantMatchComponent },
  { path: 'tenant/match', component: TenantMatchComponent },
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

  // Wildcard redirect
  { path: '**', redirectTo: '' }
];
