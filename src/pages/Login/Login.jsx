import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import { jwtDecode } from 'jwt-decode'; // Gọi đúng tên
import './Login.scss';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const response = await axios.post('http://localhost:5000/api/account/sign-in', { email, password });

            if (response.data.status === "OK") {
                const { access_token, refresh_token, account } = response.data; // Nhận cả token và thông tin tài khoản
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', refresh_token);
                console.log("Access Token:", access_token);
                console.log("Refresh Token:", refresh_token);
                // Lưu thông tin người dùng
                login({ id: account.id, role: account.role, name: account.name });

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