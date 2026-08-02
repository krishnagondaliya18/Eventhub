import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-queries',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './queries.component.html',
  styleUrls: ['./queries.component.css']
})
export class QueriesComponent implements OnInit {
  queries:   any[] = [];
  loading    = true;
  submitting = false;
  message    = '';
  msgType:   'success'|'error' = 'success';
  showForm   = false;
  editingId: string|null = null;

  categories = ['General','Payment','Event','Registration','Technical','Other'];
  form = { subject:'', message:'', category:'General' };

  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.http.get<any>('/api/queries/my').subscribe({
      next: (res) => { this.queries = res.queries||[]; this.loading = false; },
      error: ()   => { this.loading = false; }
    });
  }

  submit(): void {
    if (!this.form.subject||!this.form.message) { this.show('Subject and message are required!','error'); return; }
    this.submitting = true;
    const obs = this.editingId
      ? this.http.put<any>(`/api/queries/${this.editingId}`, this.form)
      : this.http.post<any>('/api/queries', this.form);

    obs.subscribe({
      next: () => {
        this.submitting = false; this.showForm = false; this.editingId = null;
        this.form = { subject:'', message:'', category:'General' };
        this.show('Query submitted! Admin will respond soon.','success');
        this.load();
      },
      error: (err: any) => { this.submitting = false; this.show(err?.error?.message||'Error','error'); }
    });
  }

  edit(q: any): void {
    this.editingId = q._id;
    const msgClean = q.message.replace(/^\[.*?\]\s?/,'');
    const cat = q.message.match(/^\[(.+?)\]/)?.[1] || 'General';
    this.form = { subject: q.subject, message: msgClean, category: cat };
    this.showForm = true;
  }

  delete(id: string): void {
    if (!confirm('Delete this query?')) return;
    this.http.delete<any>(`/api/queries/${id}`).subscribe({
      next: () => { this.queries = this.queries.filter(q => q._id !== id); this.show('Query deleted!','success'); },
      error: (err: any) => this.show(err?.error?.message||'Error','error')
    });
  }

  cancelForm(): void { this.showForm = false; this.editingId = null; this.form = { subject:'',message:'',category:'General' }; }
  show(msg:string,type:'success'|'error'): void { this.message=msg; this.msgType=type; setTimeout(()=>this.message='',4000); }
  getDisplayMsg(msg: string): string { return msg.replace(/^\[.*?\]\s?/,''); }
}
