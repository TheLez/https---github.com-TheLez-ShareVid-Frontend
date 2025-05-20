import React, { useEffect } from 'react';
import SideBar from '../../components/SideBar/SideBar';
import './Admin.scss';

const Admin = ({ sidebar, setSidebar }) => {
    useEffect(() => {
        setSidebar(true);
    }, [setSidebar]);

    return (
        <>
            <SideBar
                sidebar={sidebar}
                activeCategory={10}
                setActiveCategory={() => { }}
                setFeedParams={() => { }}
            />
            <div className={`container ${sidebar ? '' : 'large-container'}`}>
                <div className="admin-page">
                    <h2>Trang Quản lý</h2>
                    <p>Chào mừng đến với bảng điều khiển quản trị.</p>
                    {/* Thêm nội dung quản lý tại đây */}
                </div>
            </div>
        </>
    );
};

export default Admin;