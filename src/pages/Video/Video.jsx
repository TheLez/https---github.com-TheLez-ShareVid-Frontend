import React, { useEffect, useState } from 'react';
import './Video.scss';
import SideBar from '../../components/SideBar/SideBar';
import PlayVideo from '../../components/PlayVideo/PlayVideo';
import Recommended from '../../components/Recommended/Recommended';

const Video = ({ sidebar, setSidebar }) => {
    const [category, setCategory] = useState(0);

    useEffect(() => {
        setSidebar(false); // Đặt sidebar thành thu nhỏ khi load trang
    }, [setSidebar]);

    return (
        <div className='video-page'>
            <SideBar sidebar={sidebar} category={category} setCategory={setCategory} />
            <div className={`play-container ${sidebar ? '' : 'large-container'}`}>
                <PlayVideo />
                <Recommended />
            </div>
        </div>
    );
};

export default Video;