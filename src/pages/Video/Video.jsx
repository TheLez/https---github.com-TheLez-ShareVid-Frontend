import React, { useEffect, useState } from 'react';
import './Video.scss';
import SideBar from '../../components/SideBar/SideBar';
import PlayVideo from '../../components/PlayVideo/PlayVideo';
import Recommended from '../../components/Recommended/Recommended';
import { useParams } from 'react-router-dom';

const Video = ({ sidebar, setSidebar }) => {
    const { videoId } = useParams();
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(0);
    const [videoType, setVideoType] = useState(null);

    const handleVideoTypeChange = (type) => {
        console.log('Video.jsx: Setting videoType:', type);
        setVideoType(type);
    };

    useEffect(() => {
        console.log('Video.jsx: videoId changed:', videoId);
        setVideoType(null); // Reset videoType khi videoId thay đổi
        setSidebar(false);
    }, [videoId, setSidebar]);

    return (
        <div className='video-page'>
            <SideBar
                sidebar={sidebar}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                setFeedParams={() => { }}
                category={category}
                setCategory={setCategory}
            />
            <div className={`play-container ${sidebar ? '' : 'large-container'}`}>
                <PlayVideo
                    onVideoTypeChange={handleVideoTypeChange}
                />
                <Recommended
                    videoId={videoId}
                    videoType={videoType}
                />
            </div>
        </div>
    );
};

export default Video;