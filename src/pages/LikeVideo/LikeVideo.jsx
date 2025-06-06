import React, { useState, useEffect } from 'react';
import SideBar from '../../components/SideBar/SideBar';
import axiosInstance from '../../utils/axiosInstance';
import timeAgo from '../../utils/timeAgo';
import { Link } from 'react-router-dom';
import './LikeVideo.scss';

const LikeVideo = ({ sidebar, setSidebar }) => {
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(9);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const LIMIT = 20;

    useEffect(() => {
        setSidebar(true); // Hiện SideBar khi vào trang
    }, [setSidebar]);

    useEffect(() => {
        const fetchLikedVideos = async () => {
            if (loading || !hasMore) return; // Ngăn gọi API khi đang tải hoặc hết dữ liệu

            setLoading(true);
            try {
                const response = await axiosInstance.get('/likevideo/liked', {
                    params: { page, limit: LIMIT },
                });

                // Lọc trùng lặp videoid
                const newVideos = response.data.data;
                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.videoid));
                    const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.videoid));
                    return [...prev, ...uniqueNewVideos];
                });

                if (newVideos.length < LIMIT) setHasMore(false);
                setError(null);
            } catch (err) {
                console.error('Error fetching liked videos:', err);
                setError(err.response?.data?.error || 'Không thể tải video đã thích.');
            } finally {
                setLoading(false);
            }
        };

        fetchLikedVideos();
    }, [page, LIMIT]);

    // Reset videos khi page quay về 1
    useEffect(() => {
        if (page === 1) {
            setVideos([]);
            setHasMore(true);
        }
    }, [page]);

    const handleScroll = () => {
        if (
            window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
            hasMore &&
            !loading
        ) {
            setPage(prev => prev + 1);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading]);

    return (
        <>
            <SideBar
                sidebar={sidebar}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                setFeedParams={() => { }}
                category={category}
                setCategory={setCategory}
            />
            <div className={`container ${sidebar ? '' : 'large-container'}`}>
                <div className="liked-videos-page">
                    <h2>Video đã thích</h2>
                    {error && <p className="error">{error}</p>}
                    {loading && videos.length === 0 ? (
                        <p>Đang tải...</p>
                    ) : videos.length === 0 && !error ? (
                        <p>Không có video nào đã thích.</p>
                    ) : (
                        <div className="video-list">
                            {videos.map(video => (
                                <Link to={`/video/${video.videoid}`} key={video.videoid} className="video-card">
                                    <img src={video.thumbnail} alt={video.title} />
                                    <div className="video-details">
                                        <h4>{video.title}</h4>
                                        <p>{video.Account.name}</p>
                                        <p>{video.videoview} lượt xem • {timeAgo(video.created_at)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    {loading && videos.length > 0 && <p>Đang tải thêm...</p>}
                </div>
            </div>
        </>
    );
};

export default LikeVideo;