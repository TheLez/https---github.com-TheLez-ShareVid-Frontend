import React, { useEffect, useState } from 'react';
import './NavBar.scss';
import logo from '../../assets/images/logo.jpg';
import menu_icon from '../../assets/images/menu.png';
import search_icon from '../../assets/images/search.png';
import upload_icon from '../../assets/images/upload.png';
import blogs_icon from '../../assets/images/blogs.png';
import notification_icon from '../../assets/images/notification.png';
import { useAuth } from '../../authContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NavBar = ({ setSidebar }) => {
    const { user, logout } = useAuth(); // Giả sử context có hàm logout
    const [accountInfo, setAccountInfo] = useState(null);
    const [error, setError] = useState(null);
    const [showMenu, setShowMenu] = useState(false); // Trạng thái menu logout
    const token = localStorage.getItem('access_token');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAccountInfo = async () => {
            setError(null);
            if (user && user.id && token) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/account/get-account/${user.id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setAccountInfo(response.data);
                } catch (error) {
                    console.error("Error fetching account info:", error);
                    setError('Lỗi khi tải thông tin tài khoản. Vui lòng thử lại.');
                }
            }
        };
        fetchAccountInfo();
    }, [user, token]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        if (logout) logout(); // Gọi hàm logout từ context nếu có
        navigate('/login');
    };

    return (
        <nav className="flex-div">
            <div className="nav-left flex-div">
                <img className='menu-icon' onClick={() => setSidebar(prev => !prev)} src={menu_icon} alt="Menu" />
                <img className='logo' src={logo} alt="Logo" />
            </div>

            <div className="nav-middle flex-div">
                <div className='search-box flex-div'>
                    <input type='text' placeholder='Tìm kiếm...' />
                    <img src={search_icon} alt="Search" />
                </div>
            </div>

            <div className="nav-right flex-div">
                <img src={upload_icon} alt="Upload" />
                <img src={blogs_icon} alt="Blogs" />
                <img src={notification_icon} alt="Notifications" />

                <div className="user-menu-container" style={{ position: 'relative' }}>
                    {accountInfo ? (
                        <img
                            src={accountInfo.data.account.avatar}
                            className='user-icon'
                            alt="Profile"
                            onClick={() => setShowMenu(prev => !prev)}
                            style={{ cursor: 'pointer' }}
                        />
                    ) : (
                        <div className='user-icon placeholder'></div>
                    )}

                    {showMenu && (
                        <div className="dropdown-menu" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            background: '#fff',
                            border: '1px solid #ddd',
                            padding: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            zIndex: 10,
                        }}>
                            <button onClick={handleLogout} style={{
                                background: 'none',
                                border: 'none',
                                color: '#333',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                width: '100%',
                                textAlign: 'left'
                            }}>
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}
            </div>
        </nav>
    );
};

export default NavBar;
