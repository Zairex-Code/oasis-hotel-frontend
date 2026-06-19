import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/v1/api',
    timeout: 10000,
});

// ===========================================
// 1. REQUEST INTERCEPTOR (Inbound Guard)
// ===========================================
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (token && token !== 'undefined' && token !== 'null') {
            const cleanToken = token.replace(/"/g, ''); 
            config.headers.Authorization = `Bearer ${cleanToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ===========================================
// 2. RESPONSE INTERCEPTOR (Outbound Guard)
// ===========================================
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Intercept global 401 Unauthorized errors (e.g., expired or corrupted tokens)
        if (error.response && error.response.status === 401) {
            console.warn("⚠️ [AXIOS] Token expired or invalid. Automatic logout triggered...");
            
            if (typeof window !== 'undefined') {
                // Clear all client-side session mechanisms
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
                
                // Redirect user to authentication screen
                window.location.href = '/login?session_expired=true';
            }
        }

        return Promise.reject(error);
    }
);