import React, { useEffect, useState, useContext } from 'react';
import './NavBar.scss';
import logo from '../../assets/images/logo.jpg';
import menu_icon from '../../assets/images/menu.png';
import search_icon from '../../assets/images/search.png';
import upload_icon from '../../assets/images/upload.png';
import blogs_icon from '../../assets/images/blogs.png';
import cast_icon from '../../assets/images/cast.png';
import notification_icon from '../../assets/images/notification.png';
import { useAuth } from '../../authContext';
import axiosInstance from '../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../../NotificationContext';

const NavBar = ({ setSidebar }) => {
    const { user, logout } = useAuth();
    const { notificationCount, updateNotificationCount } = useContext(NotificationContext);
    const [accountInfo, setAccountInfo] = useState(null);
    const [error, setError] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAccountInfo = async () => {
            setError(null);
            if (user && user.id) {
                try {
                    const response = await axiosInstance.get(`/account/get-account/${user.id}`);
                    setAccountInfo(response.data);
                } catch (error) {
                    console.error("Error fetching account info:", error);
                    setError('Lỗi khi tải thông tin tài khoản. Vui lòng thử lại.');
                }
            }
        };

        fetchAccountInfo();
        if (user && user.id) {
            updateNotificationCount(user.id);
        }
    }, [user, updateNotificationCount]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (logout) logout();
        navigate('/login');
    };

    const handleSearch = () => {
        if (searchTerm) {
            navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <nav className="flex-div">
            <div className="nav-left flex-div">
                <img className='menu-icon' onClick={() => setSidebar(prev => !prev)} src={menu_icon} alt="Menu" />
                <img
                    className='logo'
                    src={logo}
                    alt="Logo"
                    onClick={() => navigate('/')}
                />
            </div>

            <div className="nav-middle flex-div">
                <div className='search-box flex-div'>
                    <input
                        type='text'
                        placeholder='Tìm kiếm...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <img
                        src={search_icon}
                        alt="Search"
                        onClick={handleSearch}
                    />
                </div>
            </div>

            <div className="nav-right flex-div">
                <img
                    src={cast_icon}
                    alt="Edit"
                    onClick={() => navigate('/edit')}
                />
                <img
                    src={upload_icon}
                    alt="Upload"
                    onClick={() => navigate('/upload')}
                />
                <img
                    src={blogs_icon}
                    alt="Record"
                    onClick={() => navigate('/record')}
                />
                <div className="notification-container">
                    <img
                        src={notification_icon}
                        alt="Notifications"
                        onClick={() => navigate('/notification')}
                    />
                    {notificationCount > 0 && (
                        <span className="notification-badge">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                    )}
                </div>

                <div className="user-menu-container">
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
                            <button
                                onClick={() => navigate('/my-profile')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#333',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    width: '100%',
                                    textAlign: 'left'
                                }}
                            >
                                Hồ sơ của tôi
                            </button>
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#333',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    width: '100%',
                                    textAlign: 'left'
                                }}
                            >
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