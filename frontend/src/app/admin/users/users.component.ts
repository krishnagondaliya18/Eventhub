import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  adminService = inject(AdminService);
  users: User[] = [];
  loading = true;
  showModal = false;
  editMode = false;
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  form: any = { name: '', email: '', password: '', phone: '', year: '', department: '', role: 'user' };
  editingId = '';

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (res: any) => { this.users = res.users || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openAdd() {
    this.form = { name: '', email: '', password: '', phone: '', year: '', department: '', role: 'user' };
    this.editMode = false; this.showModal = true; this.message = '';
  }

  openEdit(user: User) {
    this.form = { ...user, password: '' };
    this.editingId = user._id; this.editMode = true; this.showModal = true; this.message = '';
  }

  save() {
    this.saving = true;
    const obs = this.editMode
      ? this.adminService.updateUser(this.editingId, this.form)
      : this.adminService.createUser(this.form);
    obs.subscribe({
      next: () => {
        this.saving = false; this.showModal = false;
        this.loadUsers();
      },
      error: (err) => {
        this.message = err.error?.message || 'Error saving user.';
        this.messageType = 'error';
        this.saving = false;
      }
    });
  }

  delete(id: string) {
    if (!confirm('Delete this user?')) return;
    this.adminService.deleteUser(id).subscribe({ next: () => this.loadUsers() });
  }
}
