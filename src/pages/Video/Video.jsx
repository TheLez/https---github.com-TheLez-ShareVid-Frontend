import React, { useEffect, useState } from 'react';
import './Video.scss';
import SideBar from '../../components/SideBar/SideBar';
import PlayVideo from '../../components/PlayVideo/PlayVideo';
import Recommended from '../../components/Recommended/Recommended';
import { useParams } from 'react-router-dom';

const Video = ({ sidebar, setSidebar }) => {
    const { videoId } = useParams(); // Lấy videoId từ URL
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(0); // Thêm state cho activeCategory

    useEffect(() => {
        setSidebar(false); // Đặt sidebar thành thu nhỏ khi load trang
    }, [setSidebar]);

    return (
        <div className='video-page'>
            <SideBar
                sidebar={sidebar}
                activeCategory={activeCategory} // Truyền activeCategory
                setActiveCategory={setActiveCategory} // Truyền setActiveCategory
                setFeedParams={() => { }} // Có thể để hàm rỗng nếu không dùng
                category={category}
                setCategory={setCategory}
            />
            <div className={`play-container ${sidebar ? '' : 'large-container'}`}>
                <PlayVideo videoId={videoId} /> {/* Truyền videoId vào PlayVideo */}
                <Recommended videoId={videoId} /> {/* Truyền videoId vào Recommended */}
            </div>
        </div>
    );
};

export default Video;