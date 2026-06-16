import axios from 'axios';

export const api= axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 100000,
});

// ===========================================
// 2. Requests interceptor
// ===================================

api.interceptors.request.use(
    (config) => {
        // check if the user is logged in by looking for a token in the browser's storage
        // (We use 'typeof windows to ensure this only runs on the client-side browser, preventing Next.s server crashes')
        const token =typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        // if token exist, inject it into the authorization header
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    
    (error) => {
        // if something goes wrong before sending the request,reject it
        return Promise.reject(error);
    }
    
);