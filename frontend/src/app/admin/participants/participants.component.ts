import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { Participant } from '../../models/models';

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.css']
})
export class ParticipantsComponent implements OnInit {
  adminService = inject(AdminService);
  participants: Participant[] = [];
  loading = true;

  ngOnInit() {
    this.adminService.getParticipants().subscribe({
      next: (res: any) => { this.participants = res.participants || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
