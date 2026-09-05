import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);
  email = '';
  password = '';
  loading = false;
  googleLoading = false;
  showGoogleModal = false;
  googleEmail = '';
  googleName = '';
  error = '';

  login() {
    if (!this.email || !this.password) { this.error = 'Please fill all fields.'; return; }
    this.loading = true; this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.user?.role === 'admin') this.router.navigate(['/admin']);
        else this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Login failed. Check credentials.';
        this.loading = false;
      }
    });
  }

  openGoogleModal() {
    this.showGoogleModal = true;
    this.error = '';
  }

  closeGoogleModal() {
    this.showGoogleModal = false;
  }

  signInWithGoogle(accountEmail?: string, accountName?: string) {
    const selectedEmail = (accountEmail || this.googleEmail).trim();
    const selectedName  = (accountName || this.googleName || selectedEmail.split('@')[0]).trim();

    if (!selectedEmail || !selectedEmail.includes('@')) {
      this.error = 'Please provide a valid Google email address.';
      return;
    }

    this.googleLoading = true;
    this.error = '';

    this.auth.loginWithGoogle({
      email: selectedEmail,
      name: selectedName
    }).subscribe({
      next: (res: any) => {
        this.googleLoading = false;
        this.showGoogleModal = false;
        if (res.user?.role === 'admin') this.router.navigate(['/admin']);
        else if (res.user?.role === 'organizer') this.router.navigate(['/organizer/events']);
        else this.router.navigate(['/']);
      },
      error: (err) => {
        this.googleLoading = false;
        this.error = err.error?.message || 'Google sign-in failed. Please try again.';
      }
    });
  }
}
