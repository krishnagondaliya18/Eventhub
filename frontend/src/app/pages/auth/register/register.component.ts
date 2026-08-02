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
  form = { name: '', email: '', password: '', phone: '', year: '', department: '' };
  loading = false;
  error = '';

  register() {
    if (!this.form.name || !this.form.email || !this.form.password) { this.error = 'Please fill required fields.'; return; }
    this.loading = true; this.error = '';
    this.auth.register(this.form).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/']); },
      error: (err) => { this.error = err.error?.message || 'Registration failed.'; this.loading = false; }
    });
  }
}
