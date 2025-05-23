import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import axiosInstance from '../../utils/axiosInstance';
import './SideBar.scss';
import more from '../../assets/images/more.png';
import upload from '../../assets/images/upload.png';
import blogs from '../../assets/images/blogs.png';
import cast from '../../assets/images/cast.png';
import home from '../../assets/images/home.png';

const SideBar = ({ sidebar, activeCategory, setActiveCategory, setFeedParams }) => {
    const [subscribedAccounts, setSubscribedAccounts] = useState([]);
    const navigate = useNavigate();
    const { user } = useAuth();

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
        console.log(`Category clicked: ${category}, Type: ${type}, Order By View: ${orderByView}, ActiveCategory set to: ${category}`);
        const navState = { category, type, orderByView };

        switch (category) {
            case 1:
                navigate('/my-profile');
                setActiveCategory(category);
                return;
            case 2:
                navigate('/upload');
                setActiveCategory(category);
                return;
            case 3:
                navigate('/record');
                setActiveCategory(category);
                return;
            case 4:
                navigate('/edit');
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
                <hr />
                <h3>Studio</h3>
                <div className={`side-link ${activeCategory === 1 ? "active" : ""}`} onClick={() => handleCategoryClick(1, null, false)}>
                    <img src={more} alt="" /><p>Hồ sơ</p>
                </div>
                <div className={`side-link ${activeCategory === 2 ? "active" : ""}`} onClick={() => handleCategoryClick(2, null, false)}>
                    <img src={upload} alt="" /><p>Đăng video</p>
                </div>
                <div className={`side-link ${activeCategory === 3 ? "active" : ""}`} onClick={() => handleCategoryClick(3, null, false)}>
                    <img src={blogs} alt="" /><p>Ghi hình</p>
                </div>
                <div className={`side-link ${activeCategory === 4 ? "active" : ""}`} onClick={() => handleCategoryClick(4, null, false)}>
                    <img src={cast} alt="" /><p>Chỉnh sửa</p>
                </div>
                <hr />
            </div>
        </div>
    );
};

export default SideBar;