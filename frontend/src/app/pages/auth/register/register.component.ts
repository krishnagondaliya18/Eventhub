import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  auth = inject(AuthService);
  router = inject(Router);
  form: { name: string; email: string; password: string; phone: string; role: 'user' | 'organizer' } = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user'
  };
  loading = false;
  googleLoading = false;
  showGoogleModal = false;
  googleEmail = '';
  googleName = '';
  error = '';

  register() {
    if (!this.form.name || !this.form.email || !this.form.password) {
      this.error = 'Please fill all required fields.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.register(this.form).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.user?.role === 'organizer') {
          this.router.navigate(['/organizer/events']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => { this.error = err.error?.message || 'Registration failed.'; this.loading = false; }
    });
  }

  openGoogleModal() {
    this.showGoogleModal = true;
    this.error = '';
  }

  closeGoogleModal() {
    this.showGoogleModal = false;
  }

  signupWithGoogle(accountEmail?: string, accountName?: string) {
    const selectedEmail = (accountEmail || this.googleEmail || this.form.email).trim();
    const selectedName  = (accountName || this.googleName || this.form.name || selectedEmail.split('@')[0]).trim();

    if (!selectedEmail || !selectedEmail.includes('@')) {
      this.error = 'Please provide a valid Google email address.';
      return;
    }

    this.googleLoading = true;
    this.error = '';

    this.auth.loginWithGoogle({
      email: selectedEmail,
      name: selectedName,
      role: this.form.role
    }).subscribe({
      next: (res: any) => {
        this.googleLoading = false;
        this.showGoogleModal = false;
        if (res.user?.role === 'organizer') {
          this.router.navigate(['/organizer/events']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.googleLoading = false;
        this.error = err.error?.message || 'Google sign-up failed. Please try again.';
      }
    });
  }
}
