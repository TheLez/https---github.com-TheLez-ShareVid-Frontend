// src/utils/axiosInstance.js
import axios from 'axios';

const baseURL = 'http://localhost:5000/api';

const axiosInstance = axios.create({ baseURL });

// Thêm interceptor để tự động thêm access token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor để tự động refresh token nếu access token hết hạn
axiosInstance.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;
        const refreshToken = localStorage.getItem('refresh_token');

        // Nếu lỗi là 401 (hết hạn) và chưa retry lần nào
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
            originalRequest._retry = true;
            try {
                const res = await axios.post(`${baseURL}/auth/refresh-token`, { refresh_token: refreshToken });
                const newAccessToken = res.data.data.access_token;

                localStorage.setItem('access_token', newAccessToken);
                axiosInstance.defaults.headers['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                return axiosInstance(originalRequest);
            } catch (err) {
                // Nếu refresh token cũng không còn hiệu lực
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
