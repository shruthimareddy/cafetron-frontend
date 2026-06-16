import { Component, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {

  formData: RegisterRequest = {
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: '',
    role: 'EMPLOYEE'
  };

  errorMessage = signal('');
  successMessage = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);
    this.cdr.detectChanges();

    this.authService.register(this.formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Account created successfully!');
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.error || 'Registration failed. Please try again.'
        );
        this.cdr.detectChanges();
      }
    });
  }
}