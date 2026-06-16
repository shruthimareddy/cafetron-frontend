import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from "@angular/core";
import jsQR from "jsqr";
import { OrderQRService } from "../order-qr.service";
import { QRValidationResponse } from "../order-qr.models";

@Component({
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

    private stream!: MediaStream;
    private animFrame!: number;

    constructor(
        private cdr: ChangeDetectorRef,
        private orderQRService: OrderQRService
    ) {}

    async startScanner() {
        this.result = null;
        this.error = null;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            this.scanning = true;

            const video = this.videoRef.nativeElement;
            video.srcObject = this.stream;

            video.onloadedmetadata = () => {
                video.play();
                this.tick();
            }
            
        } catch (err) {
            this.error = 'Camera access denied or not available!';
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
                console.log(response);
                this.scanningCompleted.emit(response);
                this.scanning = false;
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

    stopCamera() {
    cancelAnimationFrame(this.animFrame);
    this.stream?.getTracks().forEach(t => t.stop());
    this.scanning = false;
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}