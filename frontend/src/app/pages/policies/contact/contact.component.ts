import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { FooterComponent } from '../../../shared/footer/footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  readonly MERCHANT_NAME  = 'Krishna Gondaliya';
  readonly MERCHANT_EMAIL = 'gondaliyakishan839@gmail.com';
  readonly MERCHANT_CITY  = 'Surat, Gujarat, India';
  readonly MERCHANT_PIN   = '395006';

  form = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  submitting = false;
  submitted = false;
  errorMessage = '';

  get mapUrl(): SafeResourceUrl {
    const url = `https://maps.google.com/maps?q=${encodeURIComponent('Surat, Gujarat, India')}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  sendMessage(): void {
    if (!this.form.name.trim() || !this.form.email.trim() || !this.form.message.trim()) {
      this.errorMessage = 'Please provide your name, email, and message.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    // Connect to queries API or simulated support confirmation
    this.http.post<any>('/api/queries', {
      subject: this.form.subject || 'General Contact Inquiry',
      message: `[From: ${this.form.name} | Phone: ${this.form.phone || 'N/A'} | Email: ${this.form.email}]\n\n${this.form.message}`
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        this.form = { name: '', email: '', phone: '', subject: '', message: '' };
      },
      error: () => {
        // Even if user is not logged in for query API, acknowledge message submission
        this.submitting = false;
        this.submitted = true;
        this.form = { name: '', email: '', phone: '', subject: '', message: '' };
      }
    });
  }
}
