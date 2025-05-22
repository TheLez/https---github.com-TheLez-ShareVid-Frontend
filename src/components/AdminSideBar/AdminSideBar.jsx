import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext'; // Import useAuth
import axiosInstance from '../../utils/axiosInstance';
import './AdminSideBar.scss';
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
                    <img src={subscription} alt="" /><p>Quản lý tài khoản</p>
                </div>
                <div className={`side-link ${activeCategory === 7 ? "active" : ""}`} onClick={() => handleCategoryClick(7, null, false)}>
                    <img src={history} alt="" /><p>Quản lý video</p>
                </div>
                <div className={`side-link ${activeCategory === 8 ? "active" : ""}`} onClick={() => handleCategoryClick(8, null, false)}>
                    <img src={library} alt="" /><p>Danh sách lưu</p>
                </div>
                <div className={`side-link ${activeCategory === 9 ? "active" : ""}`} onClick={() => handleCategoryClick(9, null, false)}>
                    <img src={like} alt="" /><p>Video đã thích</p>
                </div>
                <hr />
            </div>
        </div>
    );
};

export default SideBar;