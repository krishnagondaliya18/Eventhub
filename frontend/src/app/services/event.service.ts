import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event } from '../models/models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private apiUrl = '/api/events';

  constructor(private http: HttpClient) {}

  getEvents(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<any>(this.apiUrl, { params });
  }

  getEvent(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createEvent(data: Partial<Event>): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateEvent(id: string, data: Partial<Event>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  registerForEvent(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/register`, {});
  }
}
