import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import './Search.scss';
import { useAuth } from '../../authContext';

const LIMIT = 20;

const Search = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('query') || '';

    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [sortBy, setSortBy] = useState('created_at'); // Gần đây (mặc định) hoặc videoview (Thịnh hành)
    const [viewedFilter, setViewedFilter] = useState(null); // true (Đã xem), false (Chưa xem), null (Tất cả)
    const [isChannelSearch, setIsChannelSearch] = useState(false); // Tìm kiếm kênh hay video

    const observer = useRef();

    const fetchResults = useCallback(async (currentPage = 1) => {
        if (!query) {
            setError('Vui lòng nhập từ khóa tìm kiếm.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let response;
            if (isChannelSearch) {
                console.log(`📦 Fetch channels: query=${query}, page=${currentPage}`);
                response = await axiosInstance.get(
                    `/account/get/search?query=${encodeURIComponent(query)}&page=${currentPage}&limit=${LIMIT}`
                );
            } else {
                const params = new URLSearchParams({
                    query: encodeURIComponent(query),
                    sortBy,
                    page: currentPage,
                    limit: LIMIT
                });
                if (viewedFilter !== null) {
                    params.append('viewed', viewedFilter);
                }
                console.log(
                    `📦 Fetch videos: query=${query}, sortBy=${sortBy}, viewed=${viewedFilter}, page=${currentPage}`
                );
                response = await axiosInstance.get(`/video/get/search?${params.toString()}`);
            }

            console.log('API response:', response.data);
            const newResults = response.data?.data || [];

            setResults((prev) => {
                const existingIds = new Set(prev.map((item) => (isChannelSearch ? item.userid : item.videoid)));
                const filteredResults = newResults.filter(
                    (item) => !existingIds.has(isChannelSearch ? item.userid : item.videoid)
                );
                return [...prev, ...filteredResults];
            });

            setHasMore(newResults.length === LIMIT);
        } catch (err) {
            console.error('❌ Error fetching search results:', err);
            setError('Không thể tải kết quả tìm kiếm.');
        } finally {
            setLoading(false);
        }
    }, [query, sortBy, viewedFilter, isChannelSearch]);

    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
        fetchResults(1);
    }, [fetchResults, query]);

    useEffect(() => {
        if (page > 1 && hasMore && !loading) {
            fetchResults(page);
        }
    }, [page, hasMore, loading, fetchResults]);

    const lastResultRef = useCallback(
        (node) => {
            if (loading || !hasMore) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    console.log('⬇️ Near end of results, load page:', page + 1);
                    setPage((prev) => prev + 1);
                }
            }, { threshold: 0.1 });

            if (node) observer.current.observe(node);
        },
        [loading, hasMore, page]
    );

    const handleSortByRecent = () => {
        if (sortBy !== 'created_at') {
            setSortBy('created_at');
            setResults([]);
            setPage(1);
            setHasMore(true);
        }
    };

    const handleSortByTrending = () => {
        if (sortBy !== 'videoview') {
            setSortBy('videoview');
            setResults([]);
            setPage(1);
            setHasMore(true);
        }
    };

    const handleChannelSearch = () => {
        setIsChannelSearch(!isChannelSearch);
        setSortBy('created_at');
        setViewedFilter(null);
        setResults([]);
        setPage(1);
        setHasMore(true);
    };

    const handleViewedFilter = (viewed) => {
        if (viewedFilter !== viewed) {
            setViewedFilter(viewed);
            setResults([]);
            setPage(1);
            setHasMore(true);
        } else {
            setViewedFilter(null); // Tắt bộ lọc nếu bấm lại
            setResults([]);
            setPage(1);
            setHasMore(true);
        }
    };

    if (error) return <div>Lỗi: {error}</div>;
    if (!query) return <div>Vui lòng nhập từ khóa tìm kiếm.</div>;

    return (
        <div className="search-page">
            <div className="filter-buttons">
                <button
                    className={`filter-button ${sortBy === 'created_at' && !isChannelSearch ? 'active' : ''}`}
                    onClick={handleSortByRecent}
                    disabled={isChannelSearch}
                >
                    Gần đây
                </button>
                <button
                    className={`filter-button ${isChannelSearch ? 'active' : ''}`}
                    onClick={handleChannelSearch}
                >
                    Kênh
                </button>
                <button
                    className={`filter-button ${sortBy === 'videoview' && !isChannelSearch ? 'active' : ''}`}
                    onClick={handleSortByTrending}
                    disabled={isChannelSearch}
                >
                    Thịnh hành
                </button>
                <button
                    className={`filter-button ${viewedFilter === false && !isChannelSearch ? 'active' : ''}`}
                    onClick={() => handleViewedFilter(false)}
                    disabled={isChannelSearch}
                >
                    Chưa xem
                </button>
                <button
                    className={`filter-button ${viewedFilter === true && !isChannelSearch ? 'active' : ''}`}
                    onClick={() => handleViewedFilter(true)}
                    disabled={isChannelSearch}
                >
                    Đã xem
                </button>
            </div>
            <div className="search-results">
                {results.length === 0 && !loading && <p>Không tìm thấy kết quả.</p>}
                {!isChannelSearch ? (
                    results.map((video, index) => (
                        <div
                            key={video.videoid}
                            className="video-item"
                            onClick={() => navigate(`/video/${video.videoid}`)}
                            ref={index === results.length - 1 ? lastResultRef : null}
                        >
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/150';
                                }}
                            />
                            <div className="video-info">
                                <h4>{video.title}</h4>
                                <p>{video.Account.name}</p>
                                <p>{video.videoview} lượt xem</p>
                            </div>
                        </div>
                    ))
                ) : (
                    results.map((channel, index) => (
                        <div
                            key={channel.userid}
                            className="channel-item"
                            onClick={() => navigate(`/account/${channel.userid}`)}
                            ref={index === results.length - 1 ? lastResultRef : null}
                        >
                            <img
                                src={channel.avatar}
                                alt={channel.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/50';
                                }}
                            />
                            <div className="channel-info">
                                <h4>{channel.name}</h4>
                                <p>{channel.subscription} người đăng ký</p>
                            </div>
                        </div>
                    ))
                )}
                {loading && <p>Đang tải kết quả...</p>}
                {!hasMore && results.length > 0 && <p>Không còn kết quả.</p>}
            </div>
        </div>
    );
};

export default Search;