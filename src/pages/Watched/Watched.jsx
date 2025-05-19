import React, { useState, useEffect } from 'react';
import SideBar from '../../components/SideBar/SideBar';
import axiosInstance from '../../utils/axiosInstance';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import vi from 'date-fns/locale/vi';
import timeAgo from '../../utils/timeAgo';
import { Link } from 'react-router-dom';
import './Watched.scss';

const Watched = ({ sidebar, setSidebar }) => {
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(7);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const LIMIT = 20;

    // useEffect(() => {
    //     setSidebar(true);
    // }, [setSidebar]);

    useEffect(() => {
        const fetchWatchedVideos = async () => {
            if (loading || !hasMore) return;

            setLoading(true);
            try {
                const response = await axiosInstance.get('/watched/get-all', {
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
                console.error('Error fetching watched videos:', err);
                setError(err.response?.data?.message || 'Không thể tải video đã xem.');
            } finally {
                setLoading(false);
            }
        };

        fetchWatchedVideos();
    }, [page, LIMIT]);

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

    // Nhóm video theo ngày xem
    const groupVideosByDate = () => {
        const grouped = {};
        videos.forEach(video => {
            const date = parseISO(video.created_at);
            const dateKey = format(date, 'yyyy-MM-dd');
            if (!grouped[dateKey]) {
                grouped[dateKey] = { date, videos: [] };
            }
            grouped[dateKey].videos.push(video);
        });
        return Object.values(grouped).sort((a, b) => b.date - a.date); // Sắp xếp ngày mới nhất trước
    };

    const getDateLabel = (date) => {
        if (isToday(date)) return 'Hôm nay';
        if (isYesterday(date)) return 'Hôm qua';
        return format(date, 'dd/MM/yyyy', { locale: vi });
    };

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
                <div className="watched-videos-page">
                    <h2>Video đã xem</h2>
                    {error && <p className="error">{error}</p>}
                    {loading && videos.length === 0 ? (
                        <p>Đang tải...</p>
                    ) : videos.length === 0 && !error ? (
                        <p>Không có video nào đã xem.</p>
                    ) : (
                        <div className="video-groups">
                            {groupVideosByDate().map(group => (
                                <div key={group.date.toISOString()} className="video-group">
                                    <h3 className="date-header">{getDateLabel(group.date)}</h3>
                                    <div className="video-list">
                                        {group.videos.map(video => (
                                            <Link
                                                to={`/video/${video.Video.videoid}`}
                                                key={video.Video.videoid}
                                                className="video-card"
                                            >
                                                <img
                                                    src={video.Video.thumbnail}
                                                    alt={video.Video.title}
                                                />
                                                <div className="video-details">
                                                    <h4>{video.Video.title}</h4>
                                                    <p>{video.Account.name}</p>
                                                    <p>
                                                        {video.Video.videoview} lượt xem •{' '}
                                                        {timeAgo(video.Video.created_at)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {loading && videos.length > 0 && <p>Đang tải thêm...</p>}
                </div>
            </div>
        </>
    );
};

export default Watched;