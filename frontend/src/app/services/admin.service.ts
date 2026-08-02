import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  getStats(): Observable<any> { return this.http.get(`${this.apiUrl}/stats`); }

  // Users
  getUsers(): Observable<any> { return this.http.get(`${this.apiUrl}/users`); }
  createUser(data: any): Observable<any> { return this.http.post(`${this.apiUrl}/users`, data); }
  updateUser(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/users/${id}`, data); }
  deleteUser(id: string): Observable<any> { return this.http.delete(`${this.apiUrl}/users/${id}`); }

  // Participants
  getParticipants(): Observable<any> { return this.http.get(`${this.apiUrl}/participants`); }

  // Feedback & Queries
  getFeedback(type?: string): Observable<any> {
    const url = type ? `${this.apiUrl}/feedback?type=${type}` : `${this.apiUrl}/feedback`;
    return this.http.get(url);
  }
  updateFeedback(id: string, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/feedback/${id}`, data); }
}
