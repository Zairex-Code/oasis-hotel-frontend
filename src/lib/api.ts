import axios from 'axios';

export const api= axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10000,
});

// ===========================================
// 2. Requests interceptor
// ===================================

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        console.log(`🚀 [AXIOS] Enviando petición: ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`🔑 [AXIOS] ¿Hay token en localStorage?:`, token ? "✅ SÍ" : "❌ NULO");

        // 👇 CORRECCIÓN: Validamos que el token exista y NO sea la palabra "undefined" o "null"
        if (token && token !== 'undefined' && token !== 'null') {
            const cleanToken = token.replace(/"/g, ''); 
            config.headers.Authorization = `Bearer ${cleanToken}`;
        } else {
            console.log("⚠️ [AXIOS] Token inválido o ausente. La petición viajará sin cabecera de autenticación.");
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);