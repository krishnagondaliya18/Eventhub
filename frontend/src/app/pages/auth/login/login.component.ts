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
}
