import { Routes } from '@angular/router';
import { adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '',          loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'events',   loadComponent: () => import('./pages/events/events.component').then(m => m.EventsComponent) },
  { path: 'events/:id', loadComponent: () => import('./pages/event-detail/event-detail.component').then(m => m.EventDetailComponent) },
  { path: 'login',    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'profile',  loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'bookings', loadComponent: () => import('./pages/bookings/bookings.component').then(m => m.BookingsComponent) },
  { path: 'feedback', loadComponent: () => import('./pages/feedback/feedback.component').then(m => m.FeedbackComponent) },
  { path: 'queries',  loadComponent: () => import('./pages/queries/queries.component').then(m => m.QueriesComponent) },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '',             redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',   loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'users',       loadComponent: () => import('./admin/users/users.component').then(m => m.UsersComponent) },
      { path: 'event-list',  loadComponent: () => import('./admin/event-list/event-list.component').then(m => m.EventListComponent) },
      { path: 'participants',loadComponent: () => import('./admin/participants/participants.component').then(m => m.ParticipantsComponent) },
      { path: 'feedback',    loadComponent: () => import('./admin/feedback/feedback.component').then(m => m.FeedbackComponent) },
      { path: 'queries',     loadComponent: () => import('./admin/queries/queries.component').then(m => m.QueriesComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
