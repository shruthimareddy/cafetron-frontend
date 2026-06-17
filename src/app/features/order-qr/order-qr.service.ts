import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { QRResponse, QRValidationResponse } from "./order-qr.models";
import { environment } from "src/environments/environment";
import { OrderDetailResponse } from "../cart-order/models/order.models";

@Injectable({ providedIn: 'root' })
export class OrderQRService {
    constructor(private http: HttpClient) {}
    
    getQR(orderId: number) : Observable<QRResponse> {

        // const token = localStorage.getItem('auth_token') || '';
        // console.log("Token is " + token);
        return this.http.get<QRResponse>(`${environment.apiUrl}/order-qr`, {
        // headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }),
        params: { orderId: orderId }  
        });

    }

    uploadQR(formData: FormData): Observable<QRValidationResponse> {
        
   
        return this.http.post<QRValidationResponse>(`${environment.apiUrl}/order-qr`, formData);
    }

    getOrderPreviewByToken(token: string): Observable<OrderDetailResponse> {
        return this.http.get<OrderDetailResponse>(`${environment.apiUrl}/orders/qr-preview`, {
            params: { token }
        });
    }

}
