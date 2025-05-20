import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext'; // Import useAuth
import axiosInstance from '../../utils/axiosInstance';
import './SideBar.scss';
import home from '../../assets/images/home.png';
import subscription from '../../assets/images/subscription.png';
import history from '../../assets/images/history.png';
import library from '../../assets/images/library.png';
import like from '../../assets/images/like.png';
import explore from '../../assets/images/explore.png';
import music from '../../assets/images/music.png';
import game_icon from '../../assets/images/game_icon.png';
import news from '../../assets/images/news.png';
import sports from '../../assets/images/sports.png';
import tech from '../../assets/images/tech.png'; // Import icon Quản lý

const SideBar = ({ sidebar, activeCategory, setActiveCategory, setFeedParams }) => {
    const [subscribedAccounts, setSubscribedAccounts] = useState([]);
    const navigate = useNavigate();
    const { user } = useAuth(); // Lấy thông tin user từ AuthContext

    useEffect(() => {
        const fetchSubscribedAccounts = async () => {
            try {
                const response = await axiosInstance.get('/subscribe/top');
                if (response.data && Array.isArray(response.data.data)) {
                    setSubscribedAccounts(response.data.data);
                } else {
                    setSubscribedAccounts([]);
                }
            } catch (error) {
                console.error('Error fetching subscribed accounts:', error);
            }
        };

        fetchSubscribedAccounts();
    }, []);

    const handleCategoryClick = (category, type, orderByView) => {
        console.log(`Category clicked: ${category}, Type: ${type}, Order By View: ${orderByView}`);
        const navState = { category, type, orderByView };

        switch (category) {
            case 6:
                navigate('/subscribed');
                setActiveCategory(category);
                return;
            case 7:
                navigate('/watched');
                setActiveCategory(category);
                return;
            case 8:
                navigate('/saved');
                setActiveCategory(category);
                return;
            case 9:
                navigate('/liked');
                setActiveCategory(category);
                return;
            case 10:
                navigate('/admin');
                setActiveCategory(category);
                return;
            default:
                navigate('/', { state: navState });
                setActiveCategory(category);
                setFeedParams({ type, orderByView });
                break;
        }
    };

    return (
        <div className={`sidebar ${sidebar ? '' : 'small-sidebar'}`}>
            <div className='shortcut-links'>
                <div className={`side-link ${activeCategory === 0 ? "active" : ""}`} onClick={() => handleCategoryClick(0, null, false)}>
                    <img src={home} alt="" /><p>Trang chủ</p>
                </div>
                <div className={`side-link ${activeCategory === 6 ? "active" : ""}`} onClick={() => handleCategoryClick(6, null, false)}>
                    <img src={subscription} alt="" /><p>Kênh đăng ký</p>
                </div>
                <hr />
                <h3>Bạn</h3>
                <div className={`side-link ${activeCategory === 7 ? "active" : ""}`} onClick={() => handleCategoryClick(7, null, false)}>
                    <img src={history} alt="" /><p>Video đã xem</p>
                </div>
                <div className={`side-link ${activeCategory === 8 ? "active" : ""}`} onClick={() => handleCategoryClick(8, null, false)}>
                    <img src={library} alt="" /><p>Danh sách lưu</p>
                </div>
                <div className={`side-link ${activeCategory === 9 ? "active" : ""}`} onClick={() => handleCategoryClick(9, null, false)}>
                    <img src={like} alt="" /><p>Video đã thích</p>
                </div>
                <hr />
            </div>

            <div className='subscribed-list'>
                <h3>Kênh nổi bật</h3>
                {subscribedAccounts.length > 0 ? (
                    subscribedAccounts.map(account => (
                        <Link to={`/account/${account.userid}`} key={account.userid} className='side-link'>
                            <img src={account.avatar} alt={account.name} /><p>{account.name}</p>
                        </Link>
                    ))
                ) : (
                    <p>Không có kênh nào được đăng ký.</p>
                )}
                <hr />
            </div>

            <div className='shortcut-links'>
                <h3>Khám phá</h3>
                <div className={`side-link ${activeCategory === 5 ? "active" : ""}`} onClick={() => handleCategoryClick(5, null, true)}>
                    <img src={explore} alt="" /><p>Thịnh hành</p>
                </div>
                <div className={`side-link ${activeCategory === 1 ? "active" : ""}`} onClick={() => handleCategoryClick(1, 1, false)}>
                    <img src={music} alt="" /><p>Âm nhạc</p>
                </div>
                <div className={`side-link ${activeCategory === 2 ? "active" : ""}`} onClick={() => handleCategoryClick(2, 2, false)}>
                    <img src={game_icon} alt="" /><p>Trò chơi</p>
                </div>
                <div className={`side-link ${activeCategory === 3 ? "active" : ""}`} onClick={() => handleCategoryClick(3, 3, false)}>
                    <img src={news} alt="" /><p>Tin tức</p>
                </div>
                <div className={`side-link ${activeCategory === 4 ? "active" : ""}`} onClick={() => handleCategoryClick(4, 4, false)}>
                    <img src={sports} alt="" /><p>Thể thao</p>
                </div>
                <hr />
                {user && user.role === 'admin' && (
                    <div className={`side-link ${activeCategory === 10 ? "active" : ""}`} onClick={() => handleCategoryClick(10, null, false)}>
                        <img src={tech} alt="" /><p>Quản lý</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SideBar;