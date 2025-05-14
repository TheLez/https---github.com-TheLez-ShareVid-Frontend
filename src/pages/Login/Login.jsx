import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext'; // Nhập useAuth
import './Login.scss';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { setIsAuthenticated } = useAuth(); // Lấy hàm setIsAuthenticated

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage(''); // Reset message trước khi gọi API

        try {
            const response = await axios.post('http://localhost:5000/api/account/sign-in', { email, password });

            // Kiểm tra điều kiện thành công từ API
            if (response.data.status === "OK") {
                // Lưu access token vào localStorage
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token);

                // Cập nhật trạng thái xác thực
                setIsAuthenticated(true); // Thiết lập trạng thái xác thực

                // Chuyển đến trang Home
                navigate('/');
            } else {
                setMessage('Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.');
            }
        } catch (error) {
            console.error("Error during login:", error);
            setMessage('Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.');
        }
    };

    const handleRegister = () => {
        navigate('/register'); // Điều hướng đến trang đăng ký
    };

    return (
        <div className="login-container">
            <h2 className="login-title">Đăng Nhập</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    className="login-input"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    className="login-input"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button className="login-button" type="submit">Đăng Nhập</button>
            </form>
            {message && <p className="login-message">{message}</p>}
            <p className="register-prompt">
                Chưa có tài khoản? <span className="register-link" onClick={handleRegister}>Đăng ký</span>
            </p>
        </div>
    );
};

export default Login;