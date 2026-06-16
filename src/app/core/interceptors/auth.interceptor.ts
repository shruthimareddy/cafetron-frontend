import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt_token');

  console.log('🔐 AuthInterceptor - Request to:', req.url);
  console.log('   Token exists:', !!token);

  if (token) {
    console.log('   ✅ Adding Authorization header');
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  } else {
    console.warn('   ⚠️ No token found in localStorage!');
  }

  return next(req);
};
