import React, { useState, useEffect } from 'react';
import SideBar from '../../components/SideBar/SideBar';
import axiosInstance from '../../utils/axiosInstance';
import timeAgo from '../../utils/timeAgo';
import { Link } from 'react-router-dom';
import './Saved.scss';

const Saved = ({ sidebar, setSidebar }) => {
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(8);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const LIMIT = 20;

    useEffect(() => {
        setSidebar(true); // Hiện SideBar
    }, [setSidebar]);

    useEffect(() => {
        const fetchSavedVideos = async () => {
            if (loading || !hasMore) return;

            setLoading(true);
            try {
                const response = await axiosInstance.get('/save-video/get-all', {
                    params: { page, limit: LIMIT },
                });

                const newVideos = response.data.data;
                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.Video.videoid));
                    const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.Video.videoid));
                    return [...prev, ...uniqueNewVideos];
                });

                if (newVideos.length < LIMIT) setHasMore(false);
                setError(null);
            } catch (err) {
                console.error('Error fetching saved videos:', err);
                setError(err.response?.data?.message || 'Không thể tải video đã lưu.');
            } finally {
                setLoading(false);
            }
        };

        fetchSavedVideos();
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
                <div className="saved-videos-page">
                    <h2>Video đã lưu</h2>
                    {error && <p className="error">{error}</p>}
                    {loading && videos.length === 0 ? (
                        <p>Đang tải...</p>
                    ) : videos.length === 0 && !error ? (
                        <p>Không có video nào đã lưu.</p>
                    ) : (
                        <div className="video-list">
                            {videos.map(video => (
                                <Link
                                    to={`/video/${video.Video.videoid}`}
                                    key={video.Video.videoid}
                                    className="video-card"
                                >
                                    <img src={video.Video.thumbnail} alt={video.Video.title} />
                                    <div className="video-details">
                                        <h4>{video.Video.title}</h4>
                                        <p>{video.Video.Account.name}</p>
                                        <p>
                                            {video.Video.videoview} lượt xem •{' '}
                                            {timeAgo(video.Video.created_at)}
                                        </p>
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

export default Saved;