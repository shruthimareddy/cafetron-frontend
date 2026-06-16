import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface OpsStatusDTO {
  windowOpen: boolean;
  cutoffTime: string;
  cutoffPassed: boolean;
}

const BASE = `${environment.apiUrl}/admin`;

@Injectable({ providedIn: 'root' })
export class OperationsService {

  constructor(private http: HttpClient) {}

  getConfig(): Observable<OpsStatusDTO> {
    return this.http.get<OpsStatusDTO>(`${BASE}/config`);
  }

  toggleWindow(): Observable<OpsStatusDTO> {
    return this.http.post<OpsStatusDTO>(`${BASE}/window/toggle`, {});
  }

  updateCutoff(time: string): Observable<OpsStatusDTO> {
    return this.http.put<OpsStatusDTO>(`${BASE}/cutoff`, { time });
  }
}