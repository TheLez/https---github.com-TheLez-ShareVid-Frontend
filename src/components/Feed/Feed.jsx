import React, { useEffect, useState, useCallback } from 'react';
import './Feed.scss';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import timeAgo from '../../utils/timeAgo';

const Feed = ({ type, orderByView }) => {
    const [videos, setVideos] = useState([]);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const limit = 24;

    // Gọi API để lấy danh sách video
    const fetchVideos = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit,
                ...(type && { type }),
                ...(orderByView && { orderByView: true })
            });

            const res = await axiosInstance.get(`/video/get-all?${params.toString()}`);
            const fetched = res.data?.data || [];

            if (fetched.length > 0) {
                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.videoid));
                    const newVideos = fetched.filter(v => !existingIds.has(v.videoid));
                    return [...prev, ...newVideos];
                });
                setPage(prev => prev + 1);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('❌ Lỗi khi lấy danh sách video:', err);
            setError('Không thể tải danh sách video.');
        } finally {
            setIsLoading(false);
        }
    }, [page, hasMore, isLoading, type, orderByView]);

    // Reset danh sách khi thay đổi filter
    useEffect(() => {
        setVideos([]);
        setPage(1);
        setHasMore(true);
    }, [type, orderByView]);

    // Gọi fetch khi reset filter
    useEffect(() => {
        if (page === 1 && hasMore) {
            fetchVideos();
        }
    }, [page, fetchVideos]);

    // Infinite scroll handler
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 &&
                hasMore && !isLoading
            ) {
                fetchVideos();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchVideos, hasMore, isLoading]);

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
                    <p>{video.videoview} lượt xem • {timeAgo(video.created_at)}</p>
                </Link>
            ))}

            {isLoading && <p style={{ textAlign: 'center' }}>⏳ Đang tải thêm...</p>}
            {!hasMore && <p style={{ textAlign: 'center', marginTop: '1rem' }}>🎉 Đã tải hết video!</p>}
        </div>
    );
};

export default Feed;
