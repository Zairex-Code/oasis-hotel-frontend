/**
 * @file api.ts
 * @description Core Axios instance configuration and global network interceptors.
 * Handles the automatic injection of Bearer tokens (JWT) and global 401 Unauthorized fallbacks.
 * Designed to interact seamlessly with Spring Boot stateless microservices.
 */

import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/v1/api',
    timeout: 10000,
});

/**
 * 1. REQUEST INTERCEPTOR (Inbound Guard)
 * Intercepts every outgoing request to inject the JWT token from the client's LocalStorage.
 * Fixes Axios v1.x header serialization issues in Next.js Server/Client hybrid environments.
 */
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (token && token !== 'undefined' && token !== 'null') {
            const cleanToken = token.replace(/"/g, ''); 
            
            if (config.headers) {
                // Compatible with AxiosHeaders standard object mutation
                if (typeof config.headers.set === 'function') {
                    config.headers.set('Authorization', `Bearer ${cleanToken}`);
                } else {
                    config.headers['Authorization'] = `Bearer ${cleanToken}`;
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * 2. RESPONSE INTERCEPTOR (Outbound Guard)
 * Intercepts every incoming response from the backend.
 * Specifically monitors for 401 Unauthorized errors (expired or corrupted tokens).
 * If triggered, it instantly flushes the local session and forces a hard redirect to the login screen,
 * preventing rendering crashes on protected routes.
 */
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("⚠️ [AXIOS] Security Fault: Token expired or invalid. Triggering automatic logout sequence...");
            
            if (typeof window !== 'undefined') {
                // Hard-flush all client-side authentication mechanisms
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
                
                // Hard-redirect to prevent React Router race conditions
                window.location.href = '/login?session_expired=true';
            }
        }
        return Promise.reject(error);
    }
);