import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.scss'; // Nhập CSS

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [gender, setGender] = useState(1); // 1: Nam, 0: Nữ
    const [birth, setBirth] = useState('');
    const [accountdescribe, setAccountDescribe] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        // Kiểm tra mật khẩu
        if (password !== confirmPassword) {
            setMessage('Mật khẩu không khớp. Vui lòng kiểm tra lại.');
            return;
        }

        // Kiểm tra trường bắt buộc
        if (!name || !email || !password || !birth) {
            setMessage('Vui lòng điền đủ thông tin.');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('confirmpassword', confirmPassword);
        formData.append('gender', gender);
        formData.append('birth', birth);
        formData.append('accountdescribe', accountdescribe);
        if (avatar) {
            formData.append('avatar', avatar);
        }

        try {
            const response = await axios.post('http://localhost:5000/api/account/sign-up', formData);
            setMessage('Tạo tài khoản thành công!');
            navigate('/login');
        } catch (error) {
            console.error('Registration error:', error.response ? error.response.data : error.message);
            setMessage(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
    };

    return (
        <div className="register-container">
            <h2 className="register-title">Đăng Ký Tài Khoản</h2>
            <form onSubmit={handleRegister}>
                <input
                    type="text"
                    className="register-input"
                    placeholder="Tên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="email"
                    className="register-input"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    className="register-input"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    className="register-input"
                    placeholder="Xác nhận mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <select
                    className="register-input"
                    value={gender}
                    onChange={(e) => setGender(Number(e.target.value))}
                >
                    <option value={1}>Nam</option>
                    <option value={0}>Nữ</option>
                </select>
                <input
                    type="date"
                    className="register-input"
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                    required
                />
                <textarea
                    className="register-input"
                    placeholder="Mô tả tài khoản"
                    value={accountdescribe}
                    onChange={(e) => setAccountDescribe(e.target.value)}
                />
                <input
                    type="file"
                    onChange={(e) => setAvatar(e.target.files[0])}
                />
                <button className="register-button" type="submit">Đăng Ký</button>
            </form>
            {message && <p className="register-message">{message}</p>}
        </div>
    );
};

export default Register;