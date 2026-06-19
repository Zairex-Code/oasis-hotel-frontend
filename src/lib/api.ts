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
        // Obtenemos el token. (Asegúrate de que 'token' sea el nombre exacto que usaste en tu AuthContext)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        // 🕵️‍♂️ ESPÍAS DE SEGURIDAD PARA LA CONSOLA (F12)
        console.log(`🚀 [AXIOS] Enviando petición: ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`🔑 [AXIOS] ¿Hay token en localStorage?:`, token ? "✅ SÍ" : "❌ NULO");

        if (token) {
            // Limpiamos el token quitándole cualquier comilla doble residual 
            // que a veces se cuela al usar JSON.stringify()
            const cleanToken = token.replace(/"/g, ''); 
            
            // Inyectamos el pase VIP
            config.headers.Authorization = `Bearer ${cleanToken}`;
        }

        return config;
    },

    
    (error) => {
        // if something goes wrong before sending the request,reject it
        return Promise.reject(error);
    }
    
);