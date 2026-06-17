import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from "@angular/core";
import jsQR from "jsqr";
import { OrderQRService } from "../order-qr.service";
import { QRValidationResponse } from "../order-qr.models";
import { OrderDetailResponse } from "../../cart-order/models/order.models";

@Component({
    standalone: true,
    selector: 'order-qr-scanner',
    imports: [CommonModule],
    templateUrl: './order-qr-scanner.component.html',
    styleUrl: './order-qr-scanner.component.css'
})
export class OrderQrScannerComponent implements OnDestroy {

    @Output()
    scanningCompleted = new EventEmitter<QRValidationResponse>();

    @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    

    scanning: boolean = false;  
    result: string | null = null;
    error: string | null = null;
    orderPreview: OrderDetailResponse | null = null;
    isLoadingPreview = false;

    private stream: MediaStream | null = null;
    private animFrame: number | null = null;

    constructor(
        private cdr: ChangeDetectorRef,
        private orderQRService: OrderQRService
    ) {}

    async startScanner() {
        this.result = null;
        this.error = null;
        this.orderPreview = null;

        if (!navigator.mediaDevices?.getUserMedia) {
            this.error = 'Camera is not supported in this browser.';
            this.cdr.detectChanges();
            return;
        }

        this.stopCamera();

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            this.scanning = true;
            this.cdr.detectChanges();

            const video = this.videoRef.nativeElement;
            video.srcObject = this.stream;
            video.muted = true;
            video.playsInline = true;

            await new Promise<void>((resolve) => {
                video.onloadedmetadata = () => resolve();
            });

            await video.play();
            this.tick();
            
        } catch (err) {
            this.error = 'Camera access denied or not available!';
            this.scanning = false;
            this.cdr.detectChanges();
        }
    }

    private tick() {
        const video = this.videoRef.nativeElement;
        const canvas = this.canvasRef.nativeElement;
        const ctx = canvas.getContext('2d')!;

        if ( video.readyState == video.HAVE_ENOUGH_DATA ) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);

            if (code) {
                this.stopCamera();
                this.sendToBackend(canvas);
                return;
            }
        }
        this.animFrame = requestAnimationFrame(() => this.tick());
    }

    private sendToBackend(canvas: HTMLCanvasElement) {
        canvas.toBlob(blob => {
        if (!blob) {
            this.error = 'Failed to capture image.';
            this.scanning = false;
            return;
        }

        const form = new FormData();
        form.append('qr', blob, 'qr.png');

        
            this.orderQRService.uploadQR(form).subscribe({
            next: response => {
                this.result = response.message || (response.isValid ? 'QR validated successfully.' : 'QR is invalid.');
                this.scanningCompleted.emit(response);
                this.scanning = false;
                if (response.isValid && response.token) {
                    this.loadOrderPreview(response.token);
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.error = 'Failed to decode QR. Please try again.';
                this.scanning = false;
                this.cdr.detectChanges();
            }
        
            });
        });
  }

    private loadOrderPreview(token: string) {
        this.isLoadingPreview = true;
        this.error = null;
        this.orderQRService.getOrderPreviewByToken(token).subscribe({
            next: preview => {
                this.orderPreview = preview;
                this.isLoadingPreview = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.error = 'QR validated, but order details could not be loaded.';
                this.isLoadingPreview = false;
                this.cdr.detectChanges();
            }
        });
    }

    getPreviewTotalItems(): number {
        return this.orderPreview?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    }

    getLineTotal(unitPrice: number, quantity: number): number {
        return Number(unitPrice || 0) * Number(quantity || 0);
    }

        stopCamera() {
        if (this.animFrame !== null) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }

        this.stream?.getTracks().forEach(t => t.stop());
        this.stream = null;
        this.scanning = false;
    }

  ngOnDestroy() {
    this.stopCamera();
  }
}
