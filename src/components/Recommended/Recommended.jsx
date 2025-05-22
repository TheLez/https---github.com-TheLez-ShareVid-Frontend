import React, { useEffect, useState, useCallback } from 'react';
import './Recommended.scss';
import axiosInstance from '../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import timeAgo from '../../utils/timeAgo';

const LIMIT = 20;

const Recommended = ({ videoId, videoType }) => {
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();

    console.log('Recommended component rendered', { videoId, videoType });

    const fetchRecommendations = useCallback(async (retryCount = 0, maxRetries = 3) => {
        if (retryCount >= maxRetries) {
            console.warn('⚠️ Max retries reached, stopping API calls');
            setLoading(false);
            setHasMore(false);
            return;
        }

        try {
            setLoading(true);
            console.log(`📦 Fetch recommended videos: type=${videoType}, page=${page}, retry=${retryCount}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const res = await axiosInstance.get(`/video/type/${videoType}?exclude=${videoId}&limit=${LIMIT}&page=${page}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            console.log('API response fetchRecommendations:', res.data);
            const data = res.data?.data || [];
            console.log('Fetched video IDs:', data.map(v => v.videoid));

            if (data.length === 0) {
                console.warn(`⚠️ Empty data for page ${page}`);
                setHasMore(false);
                return;
            }

            setVideos(prev => {
                const existingIds = new Set(prev.map(v => v.videoid));
                const newVideos = data.filter(v => !existingIds.has(v.videoid));
                console.log('New video IDs:', newVideos.map(v => v.videoid));
                return [...prev, ...newVideos];
            });
            setHasMore(data.length === LIMIT);
        } catch (err) {
            console.error('❌ Error fetching recommendations:', err);
            setError(err.response?.data?.error || 'Không thể tải video đề xuất.');
        } finally {
            setLoading(false);
            console.log('fetchRecommendations completed');
        }
    }, [videoType, page, videoId]);

    useEffect(() => {
        console.log('Recommended useEffect:', { videoType, videoId, hasMore, page });
        // Reset state khi videoId hoặc videoType thay đổi
        setVideos([]);
        setPage(1);
        setHasMore(true);
        setError(null);
        setLoading(true);

        if (videoType === null || videoType === undefined || !videoId) {
            console.warn('⚠️ Skipping fetch due to:', {
                videoTypeIsNull: videoType === null || videoType === undefined,
                videoIdIsNull: !videoId
            });
            setLoading(false);
            return;
        }
        fetchRecommendations();
    }, [videoId, videoType]); // Chỉ phụ thuộc vào videoId và videoType

    useEffect(() => {
        const debounce = (fn, delay) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn(...args), delay);
            };
        };

        const handleScroll = debounce(() => {
            if (
                window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
                !loading &&
                hasMore &&
                videoType !== null && videoType !== undefined
            ) {
                console.log('⬇️ Scroll to bottom, load next page', { page: page + 1 });
                setPage(prev => prev + 1);
            }
        }, 200);

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, hasMore, videoType]);

    if (error) return <div>Lỗi: {error}</div>;

    const uniqueVideos = Array.from(
        new Map(videos.map(video => [video.videoid, video])).values()
    ).filter(video => video && video.videoid && video.thumbnail && video.title && video.Account);

    console.log('Unique video IDs:', uniqueVideos.map(v => v.videoid));

    return (
        <div className='recommended'>
            {uniqueVideos.length > 0 ? (
                uniqueVideos.map((video) => (
                    <div
                        className='side-video-list'
                        key={video.videoid}
                        onClick={() => navigate(`/video/${video.videoid}`)}
                    >
                        <img
                            src={video.thumbnail}
                            alt={video.title}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150';
                            }}
                        />
                        <div className='vid-info'>
                            <h4>{video.title}</h4>
                            <p>{video.Account.name}</p>
                            <p>{video.videoview} lượt xem • {timeAgo(video.created_at)}</p>
                        </div>
                    </div>
                ))
            ) : (
                !loading && <p>Không có video đề xuất.</p>
            )}
            {loading && <p>Đang tải...</p>}
        </div>
    );
};

export default Recommended;