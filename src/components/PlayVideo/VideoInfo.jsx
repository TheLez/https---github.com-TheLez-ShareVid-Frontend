import React, { useState } from 'react';
import like from '../../assets/images/like.png';
import dislike from '../../assets/images/dislike.png';
import share from '../../assets/images/share.png';
import save from '../../assets/images/save.png';
import tech from '../../assets/images/messages.png';
import timeAgo from '../../utils/timeAgo';
import ReportMenu from './ReportMenu';

const VideoInfo = ({ video, userLike, isSaved, handleLike, handleDislike, handleSave }) => {
    const [reportMenuOpen, setReportMenuOpen] = useState(false);

    const handleReport = () => {
        setReportMenuOpen(prev => !prev);
    };

    return (
        <div className='play-video-info'>
            <p>{video.videoview} lượt xem • {timeAgo(video.created_at)}</p>
            <div>
                <span onClick={handleLike} className={`icon ${userLike === 1 ? 'active' : ''}`}>
                    <img src={like} alt='Thích' />
                    {video.videolike}
                </span>
                <span onClick={handleDislike} className={`icon ${userLike === 0 ? 'active' : ''}`}>
                    <img src={dislike} alt='Không thích' />
                    {video.videodislike}
                </span>
                <span><img src={share} alt='Chia sẻ' />Chia sẻ</span>
                <span onClick={handleSave} className={`icon ${isSaved ? 'saved' : ''}`}>
                    <img src={save} alt='Lưu' />
                    {isSaved ? 'Đã lưu' : 'Lưu'}
                </span>
                <span onClick={handleReport} className='report-button'>
                    <img src={tech} alt='Báo cáo' />Báo cáo
                </span>
                {reportMenuOpen && (
                    <ReportMenu video={video} onClose={() => setReportMenuOpen(false)} />
                )}
            </div>
        </div>
    );
};

export default VideoInfo;