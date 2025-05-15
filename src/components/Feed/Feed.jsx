import React, { useEffect, useState } from 'react';
import './Feed.scss';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import timeAgo from '../../utils/timeAgo'; // Import hàm

const Feed = ({ category }) => {
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await axiosInstance.get('/video/get-all');
                setVideos(res.data.data || []);
            } catch (err) {
                console.error('Lỗi khi lấy danh sách video:', err);
                setError('Không thể tải danh sách video.');
            }
        };

        fetchVideos();
    }, [category]);

    return (
        <div className='feed'>
            {error && <div className="error">{error}</div>}

            {videos.map((video) => (
                <Link
                    to={`/video/${video.videoid}`}
                    className='card'
                    key={video.videoid}
                >
                    <img src={video.thumbnail} alt={video.title} />
                    <h2>{video.title}</h2>
                    <h3>{video.Account?.name || 'Không rõ người đăng'}</h3>
                    <p>{video.videoview} lượt xem &bull; {timeAgo(video.created_at)}</p>
                </Link>
            ))}
        </div>
    );
};

export default Feed;