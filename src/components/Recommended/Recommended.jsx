import React, { useEffect, useState, useCallback, useRef } from 'react';
import './Recommended.scss';
import axiosInstance from '../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

const LIMIT = 20;

const Recommended = ({ videoId }) => {
    const [videoType, setVideoType] = useState(null);
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();
    const videoTypeRef = useRef(null);

    console.log('Recommended component mounted', { videoId });
    console.log('axiosInstance config:', axiosInstance.defaults);

    useEffect(() => {
        console.log('useEffect 1 bắt đầu', { videoId });
        if (!videoId) {
            console.warn('⚠️ videoId không hợp lệ, dừng fetch');
            setLoading(false);
            return;
        }

        const fetchVideoType = async (retryCount = 0, maxRetries = 3) => {
            if (retryCount >= maxRetries) {
                console.warn('⚠️ Max retries reached for fetchVideoType, stopping');
                setError('Không thể tải thông tin video sau nhiều lần thử.');
                setLoading(false);
                return;
            }

            try {
                console.log('▶️ Fetch video by ID:', videoId, `retry=${retryCount}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const res = await axiosInstance.get(`/video/${videoId}`, { signal: controller.signal });
                clearTimeout(timeoutId);
                console.log('API response fetchVideoType:', res.data);
                const { videotype } = res.data;
                console.log('✅ Video type:', videotype);
                if (videotype === undefined || videotype === null) {
                    console.warn('⚠️ No videoType returned, stopping fetch');
                    setError('Không có loại video hợp lệ.');
                    setLoading(false);
                    return;
                }
                setVideoType(videotype);
                videoTypeRef.current = videotype;
                console.log('Đã gọi setVideoType với:', videotype, 'videoTypeRef:', videoTypeRef.current);
                setPage(1);
                setVideos([]);
                setHasMore(true);
            } catch (err) {
                console.error('❌ Error fetching video by ID:', err);
                console.warn(`⚠️ Retrying fetchVideoType... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => fetchVideoType(retryCount + 1, maxRetries), 1000);
            } finally {
                console.log('useEffect 1 kết thúc');
            }
        };

        fetchVideoType();
    }, [videoId]);

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
                console.warn(`⚠️ Empty data for page ${page}, retrying with next page...`);
                setPage(prev => prev + 1);
                return fetchRecommendations(retryCount + 1, maxRetries);
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
            console.warn(`⚠️ Retrying... (${retryCount + 1}/${maxRetries})`);
            return fetchRecommendations(retryCount + 1, maxRetries);
        } finally {
            if (retryCount === 0) {
                setLoading(false);
            }
            console.log('fetchRecommendations kết thúc');
        }
    }, [videoType, page, videoId]);

    useEffect(() => {
        console.log('useEffect 2 kiểm tra điều kiện:', { videoType, videoId, hasMore, page });
        if (videoType === null || videoType === undefined || !videoId || !hasMore) {
            console.warn('⚠️ useEffect 2 không chạy do:', {
                videoTypeIsNull: videoType === null || videoType === undefined,
                videoIdIsNull: !videoId,
                hasMoreIsFalse: !hasMore
            });
            return;
        }
        console.log('useEffect 2 bắt đầu');
        fetchRecommendations();
    }, [fetchRecommendations, videoType, page, videoId, hasMore]);

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

    console.log('Videos before unique:', videos.map(v => v.videoid));
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
                            <p>{video.videoview} lượt xem</p>
                        </div>
                    </div>
                ))
            ) : (
                !loading && <p>Đang tải...</p>
            )}
            {loading && <p>Đang tải...</p>}
        </div>
    );
};

export default React.memo(Recommended, (prevProps, nextProps) => prevProps.videoId === nextProps.videoId);