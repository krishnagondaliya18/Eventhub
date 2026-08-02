import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = {};
  editMode  = false;
  saving    = false;
  message   = '';
  msgType:  'success'|'error' = 'success';
  form      = { name:'', phone:'', year:'', department:'' };
  pwForm    = { currentPassword:'', newPassword:'', confirmPassword:'' };
  showPw    = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    const u = this.auth.getUser();
    if (u) { this.user = u; this.form = { name: u.name||'', phone: u.phone||'', year: u.year||'', department: u.department||'' }; }
  }

  saveProfile(): void {
    this.saving = true;
    this.auth.updateProfile(this.form).subscribe({
      next: (res: any) => {
        this.saving = false; this.editMode = false;
        this.user = res.user || this.user;
        this.show('Profile updated successfully!', 'success');
      },
      error: (err: any) => { this.saving = false; this.show(err?.error?.message || 'Error occurred', 'error'); }
    });
  }

  changePassword(): void {
    if (this.pwForm.newPassword !== this.pwForm.confirmPassword) { this.show('Passwords do not match!', 'error'); return; }
    this.saving = true;
    this.auth.changePassword(this.pwForm).subscribe({
      next: () => {
        this.saving = false; this.showPw = false;
        this.pwForm = { currentPassword:'', newPassword:'', confirmPassword:'' };
        this.show('Password changed successfully!', 'success');
      },
      error: (err: any) => { this.saving = false; this.show(err?.error?.message || 'Error occurred', 'error'); }
    });
  }

  cancelEdit(): void {
    this.editMode = false;
    const u = this.user;
    this.form = { name: u.name||'', phone: u.phone||'', year: u.year||'', department: u.department||'' };
  }

  show(msg: string, type: 'success'|'error'): void {
    this.message = msg; this.msgType = type;
    setTimeout(() => this.message = '', 4000);
  }
}
