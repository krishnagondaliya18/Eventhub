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

    const payload = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      phone: this.form.phone.trim(),
      subject: this.form.subject.trim() || 'General Contact Inquiry',
      message: this.form.message.trim(),
      category: 'Contact Us'
    };

    this.http.post<any>('/api/queries/contact', payload).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        this.form = { name: '', email: '', phone: '', subject: '', message: '' };
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'Failed to send message. Please check your details and try again.';
      }
    });
  }
}
