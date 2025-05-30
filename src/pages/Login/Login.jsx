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
                const { access_token, refresh_token, account } = response.data;
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', refresh_token);

                login({ id: account.id, role: account.role, name: account.name, avatar: account.avatar });

                navigate('/');
            } else {
                // Nếu backend trả về status khác OK nhưng vẫn trong try (ví dụ status 200)
                setMessage(response.data.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
            }
        } catch (error) {
            // Trường hợp status !== 2xx, axios sẽ nhảy vào đây
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Đăng nhập thất bại.';
            setMessage(errorMsg);
            console.error("Error during login:", errorMsg);
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
            <br />
            {message && <p className="login-message">{message}</p>}
            <p className="register-prompt">
                Chưa có tài khoản? <span className="register-link" onClick={handleRegister}>Đăng ký</span>
            </p>
        </div>
    );
};

export default Login;