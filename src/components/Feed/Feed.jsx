import React, { useEffect, useState } from 'react';
import './Feed.scss';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import timeAgo from '../../utils/timeAgo'; // Import hàm

const Feed = ({ category }) => {
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 50; // Số lượng video trên mỗi trang

    const fetchVideos = async () => {
        if (!hasMore) return; // Nếu không còn video để tải
        try {
            const res = await axiosInstance.get(`/video/get-all?page=${page}&limit=${limit}`);

            if (res.data.data.length > 0) {
                setVideos((prev) => {
                    // Chỉ thêm video mới nếu chưa có trong danh sách
                    const newVideos = res.data.data.filter(video => !prev.some(v => v.videoid === video.videoid));
                    return [...prev, ...newVideos];
                });
                setPage((prev) => prev + 1); // Tăng trang cho lần tải tiếp theo
            } else {
                setHasMore(false); // Không còn video để tải
            }
        } catch (err) {
            console.error('Lỗi khi lấy danh sách video:', err);
            setError('Không thể tải danh sách video.');
        }
    };

    useEffect(() => {
        fetchVideos(); // Gọi hàm ở đây
    }, [page]);

    // Hàm xử lý cuộn trang
    const handleScroll = () => {
        if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || error) return;
        fetchVideos();
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [error]);

    return (
        <div className='feed'>
            {error && <div className="error">{error}</div>}

            {videos.map((video) => (
                <Link
                    to={`/video/${video.videoid}`}
                    className='card'
                    key={video.videoid} // Đảm bảo videoid là duy nhất
                >
                    <img src={video.thumbnail} alt={video.title} />
                    <h2>{video.title}</h2>
                    <h3>{video.Account?.name || 'Không rõ người đăng'}</h3>
                    <p>{video.videoview} lượt xem &bull; {timeAgo(video.created_at)}</p>
                </Link>
            ))}
            {/* Xóa thông báo không còn video */}
        </div>
    );
};

export default Feed;