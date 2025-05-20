import React, { useEffect, useState, useRef, useCallback } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../authContext';
import timeAgo from '../../utils/timeAgo';
import './Notification.scss';
import SideBar from '../../components/SideBar/SideBar';

const Notification = ({ sidebar, setSidebar }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(0);

    const observer = useRef();

    useEffect(() => {
        setSidebar(true);
    }, [setSidebar]);

    const fetchNotifications = async (currentPage = 1) => {
        if (!user || isFetching || !hasMore) return;

        setIsFetching(true);
        try {
            console.log(`📬 Fetch notifications: userid=${user.id}, page=${currentPage}`);
            const response = await axiosInstance.get(`/notification/get-all?page=${currentPage}&limit=10`);
            console.log('API response fetchNotifications:', response.data);

            const notificationsData = response.data?.data || [];
            console.log('Fetched notifications:', notificationsData);

            if (currentPage === 1) {
                setNotifications(notificationsData);
            } else {
                setNotifications(prev => [...prev, ...notificationsData]);
            }

            setHasMore(notificationsData.length === 10);
            console.log('Updated notifications state:', notificationsData.length, 'hasMore:', notificationsData.length === 10);
        } catch (error) {
            console.error('Lỗi khi lấy thông báo:', error);
            setError('Không thể tải thông báo.');
        } finally {
            setIsFetching(false);
            setLoading(false);
            console.log('fetchNotifications kết thúc');
        }
    };

    useEffect(() => {
        if (user) {
            console.log('User loaded, fetching notifications for userid:', user.id);
            setNotifications([]);
            setPage(1);
            setHasMore(true);
            setLoading(true);
            fetchNotifications(1);
        }
    }, [user]);

    useEffect(() => {
        if (page > 1) {
            console.log('Fetching next page:', page);
            fetchNotifications(page);
        }
    }, [page]);

    const lastNotificationRef = useCallback(node => {
        if (isFetching) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isFetching) {
                console.log('⬇️ Gần cuối danh sách thông báo, load page:', page + 1);
                setPage(prevPage => prevPage + 1);
            }
        }, { threshold: 0.1 });

        if (node) observer.current.observe(node);
    }, [isFetching, hasMore]);

    const markAsRead = async (notificationId) => {
        try {
            console.log(`📌 Marking notification ${notificationId} as read`);
            await axiosInstance.patch(`/notification/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n =>
                    n.notificationid === notificationId ? { ...n, status: 1 } : n
                )
            );
        } catch (error) {
            console.error(`Lỗi khi đánh dấu thông báo ${notificationId} đã đọc:`, error);
        }
    };

    console.log('Rendering notifications:', notifications);

    if (loading) return <div>Đang tải...</div>;
    if (error) return <div>Lỗi: {error}</div>;

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
            <div className="notification-page">
                <h2>Thông báo</h2>
                {notifications.length === 0 ? (
                    <p>Không có thông báo nào.</p>
                ) : (
                    notifications.map((notification, index) => {
                        const isLast = index === notifications.length - 1;
                        console.log('Rendering notification:', notification.notificationid, notification.content);
                        return (
                            <div
                                className={`notification-card ${notification.status === 0 ? 'unread' : 'read'}`}
                                key={notification.notificationid}
                                ref={isLast ? lastNotificationRef : null}
                            >
                                <div className="notification-content">
                                    <p>{notification.content}</p>
                                    <span>{timeAgo(notification.created_at)}</span>
                                </div>
                                {notification.status === 0 && (
                                    <button
                                        onClick={() => markAsRead(notification.notificationid)}
                                        className="mark-read-button"
                                    >
                                        Đánh dấu đã đọc
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
                {isFetching && <p>Đang tải thêm thông báo...</p>}
            </div>
        </>

    );
};

export default Notification;