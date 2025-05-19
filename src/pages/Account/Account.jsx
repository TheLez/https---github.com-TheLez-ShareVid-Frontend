import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Account.scss';
import SideBar from '../../components/SideBar/SideBar';
import axiosInstance from '../../utils/axiosInstance';
import timeAgo from '../../utils/timeAgo';
import { Link } from 'react-router-dom';

const Account = ({ sidebar, setSidebar }) => {
    const { id } = useParams();
    const [accountData, setAccountData] = useState(null);
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(0);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const LIMIT = 20;

    useEffect(() => {
        setSidebar(true); // Hiện SideBar khi vào trang
    }, [setSidebar]);

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const res = await axiosInstance.get(`/account/get-account/${id}`);
                setAccountData(res.data.data.account);
                setError(null);
            } catch (err) {
                console.error('Error fetching account:', err);
                setError(err.response?.data?.error || 'Không thể tải thông tin tài khoản.');
            }
        };

        const checkSubscribe = async () => {
            try {
                console.log('🔍 Kiểm tra trạng thái đăng ký:', id);
                const response = await axiosInstance.get(`/subscribe/subscribed/${id}`);
                console.log('API response checkSubscribe:', response.data);
                setIsSubscribed(!!response.data.isSubscribed);
            } catch (err) {
                console.error('Lỗi khi kiểm tra trạng thái đăng ký:', err);
                setIsSubscribed(false);
            }
        };

        fetchAccount();
        checkSubscribe();
    }, [id]);

    useEffect(() => {
        const fetchVideos = async () => {
            if (loading || !hasMore) return; // Ngăn gọi API khi đang tải

            setLoading(true);
            try {
                const res = await axiosInstance.get(`/video/account/${id}?page=${page}&limit=${LIMIT}`);
                const newVideos = res.data.data;
                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.videoid));
                    const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.videoid));
                    return [...prev, ...uniqueNewVideos];
                });
                if (newVideos.length < LIMIT) setHasMore(false);
                setError(null);
            } catch (err) {
                console.error('Error fetching videos:', err);
                setError(err.response?.data?.error || 'Không thể tải video.');
            } finally {
                setLoading(false);
            }
        };

        if (hasMore) fetchVideos();
    }, [page, id]);

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

    const handleSubscribe = async () => {
        try {
            if (isSubscribed) {
                console.log('🔔 Hủy đăng ký:', id);
                await axiosInstance.delete(`/subscribe/delete-subscribe/${id}`);
                setIsSubscribed(false);
                setAccountData(prev => ({
                    ...prev,
                    subscription: prev.subscription - 1
                }));
            } else {
                console.log('🔔 Đăng ký:', id);
                await axiosInstance.post('/subscribe/subscribe', { useridsub: id });
                setIsSubscribed(true);
                setAccountData(prev => ({
                    ...prev,
                    subscription: prev.subscription + 1
                }));
            }
        } catch (err) {
            console.error('Lỗi khi thực hiện đăng ký/hủy đăng ký:', err);
            setError(err.response?.data?.error || 'Không thể thực hiện đăng ký.');
        }
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
                <div className="account-page">
                    {error && <p className="error">{error}</p>}
                    {accountData ? (
                        <div className="account-info">
                            <img className="avatar" src={accountData.avatar} alt={accountData.name} />
                            <h2>{accountData.name}</h2>
                            <p>{accountData.accountdescribe}</p>
                            <p>Đăng ký: {accountData.subscription}</p>
                            <button
                                className={`subscribe-button ${isSubscribed ? 'subscribed' : ''}`}
                                onClick={handleSubscribe}
                            >
                                {isSubscribed ? 'Đã đăng ký' : 'Đăng ký'}
                            </button>
                        </div>
                    ) : (
                        <p>Đang tải thông tin tài khoản...</p>
                    )}

                    <div className="video-list">
                        {videos.length === 0 && !loading ? (
                            <p>Không có video nào.</p>
                        ) : (
                            videos.map(video => (
                                <Link
                                    to={`/video/${video.videoid}`}
                                    key={video.videoid}
                                    className="video-card"
                                >
                                    <img src={video.thumbnail} alt={video.title} />
                                    <div className="video-details">
                                        <h4>{video.title}</h4>
                                        <p>{video.videoview} lượt xem • {timeAgo(video.created_at)}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                    {loading && <p>Đang tải thêm...</p>}
                </div>
            </div>
        </>
    );
};

export default Account;