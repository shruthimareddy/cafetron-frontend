import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DailySummaryDTO {
  date: string;
  orderCount: number;
  revenue: number;
  itemsSold: number;
}

export interface TopItemDTO {
  menuItemId: number;
  name: string;
  qtySold: number;
}

export interface RevenuePointDTO {
  date: string;
  revenue: number;
}

export interface StatusCountDTO {
  status: string;
  count: number;
}

export interface VendorDeclineSummaryDTO {
  vendorId: number;
  vendorName: string;
  declineCount: number;
  totalRefunded: number;
}

const BASE = `${environment.apiUrl}/admin/reports`;

@Injectable({ providedIn: 'root' })
export class AdminReportService {

  constructor(private http: HttpClient) {}

  getDailySummary(date: string): Observable<DailySummaryDTO> {
    return this.http.get<DailySummaryDTO>(`${BASE}/daily`,
      { params: new HttpParams().set('date', date) });
  }

  getTopItems(limit = 10): Observable<TopItemDTO[]> {
    return this.http.get<TopItemDTO[]>(`${BASE}/top-items`,
      { params: new HttpParams().set('limit', limit) });
  }

  getRevenueRange(from: string, to: string): Observable<RevenuePointDTO[]> {
    return this.http.get<RevenuePointDTO[]>(`${BASE}/range`,
      { params: new HttpParams().set('from', from).set('to', to) });
  }

  getStatusBreakdown(date: string): Observable<StatusCountDTO[]> {
    return this.http.get<StatusCountDTO[]>(`${BASE}/status-breakdown`,
      { params: new HttpParams().set('date', date) });
  }

  getVendorDeclines(date: string): Observable<VendorDeclineSummaryDTO[]> {
    return this.http.get<VendorDeclineSummaryDTO[]>(`${BASE}/vendor-declines`,
      { params: new HttpParams().set('date', date) });
  }

  // CSV export — triggers browser download
  downloadDailyCsv(date: string): void {
    window.open(`${BASE}/daily/export?date=${date}`, '_blank');
  }

  downloadTopItemsCsv(limit = 10): void {
    window.open(`${BASE}/top-items/export?limit=${limit}`, '_blank');
  }

  downloadRangeCsv(from: string, to: string): void {
    window.open(`${BASE}/range/export?from=${from}&to=${to}`, '_blank');
  }

  downloadVendorDeclinesCsv(date: string): void {
    window.open(`${BASE}/vendor-declines/export?date=${date}`, '_blank');
  }
}