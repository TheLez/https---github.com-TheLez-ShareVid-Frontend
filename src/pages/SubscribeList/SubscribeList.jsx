import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SideBar from '../../components/SideBar/SideBar';
import axiosInstance from '../../utils/axiosInstance';
import './SubscribeList.scss';

const SubscribeList = ({ sidebar, setSidebar }) => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState(6); // Category 6 cho Kênh đăng ký
    const limit = 20;

    useEffect(() => {
        setSidebar(true);
        setActiveCategory(6); // Đảm bảo mục Kênh đăng ký được active
    }, [setSidebar]);

    // Gọi API để lấy danh sách subscriptions
    const fetchSubscriptions = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page, limit });
            console.log('Fetching subscriptions with params:', params.toString());

            const res = await axiosInstance.get(`/subscribe/get-all?${params.toString()}`);
            const fetched = res.data?.data || [];

            console.log('Fetched subscriptions:', fetched.map(s => s.userid));

            if (fetched.length > 0) {
                setSubscriptions(prev => {
                    const existingIds = new Set(prev.map(s => s.userid));
                    const newSubscriptions = fetched.filter(s => !existingIds.has(s.userid));
                    return [...prev, ...newSubscriptions];
                });
                setPage(prev => prev + 1);
            } else {
                setHasMore(false);
            }
            setError(null);
        } catch (err) {
            console.error('❌ Lỗi khi lấy danh sách đăng ký:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách đăng ký.');
        } finally {
            setIsLoading(false);
        }
    }, [page, hasMore, isLoading]);

    // Gọi fetch khi page thay đổi
    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    // Infinite scroll handler
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 &&
                hasMore && !isLoading
            ) {
                fetchSubscriptions();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchSubscriptions, hasMore, isLoading]);

    return (
        <>
            <SideBar
                sidebar={sidebar}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                setFeedParams={() => { }}
            />
            <div className={`container ${sidebar ? '' : 'large-container'}`}>
                <div className="subscribe-list">
                    <h2>Kênh đăng ký</h2>
                    {error && <div className="error">{error}</div>}
                    {subscriptions.length === 0 && !isLoading && !error ? (
                        <p>Bạn chưa đăng ký kênh nào.</p>
                    ) : (
                        <div className="account-list">
                            {subscriptions.map(account => (
                                <Link
                                    to={`/account/${account.userid}`}
                                    className="account-card"
                                    key={account.userid}
                                >
                                    <img src={account.avatar} alt={account.name} />
                                    <div className="account-details">
                                        <h3>{account.name}</h3>
                                        <p>{account.subscriberCount} người đăng ký</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    {isLoading && <p style={{ textAlign: 'center' }}>⏳ Đang tải thêm...</p>}
                    {!hasMore && subscriptions.length > 0 && (
                        <p style={{ textAlign: 'center', marginTop: '1rem' }}>🎉 Đã tải hết danh sách!</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default SubscribeList;