import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './Account.scss';
import SideBar from '../../components/SideBar/SideBar';
import axiosInstance from '../../utils/axiosInstance'; // dùng instance đã cấu hình

const Account = ({ sidebar, setSidebar }) => {
    const { id } = useParams();
    const [accountData, setAccountData] = useState(null);
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(0); // Thêm state cho activeCategory
    const LIMIT = 20;

    useEffect(() => {
        setSidebar(true); // hiện SideBar khi vào trang này
    }, [setSidebar]);

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const res = await axiosInstance.get(`/account/get-account/${id}`);
                setAccountData(res.data.data.account);
            } catch (err) {
                console.error('Error fetching account:', err);
            }
        };

        fetchAccount();
    }, [id]);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await axiosInstance.get(`/video/account/${id}?page=${page}&limit=${LIMIT}`);
                setVideos(prev => [...prev, ...res.data.data]);
                if (res.data.data.length < LIMIT) setHasMore(false);
            } catch (err) {
                console.error('Error fetching videos:', err);
            }
        };

        if (hasMore) fetchVideos();
    }, [page, id]);

    const handleScroll = () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore]);

    return (
        <>
            <SideBar
                sidebar={sidebar}
                activeCategory={activeCategory} // Truyền activeCategory
                setActiveCategory={setActiveCategory} // Truyền setActiveCategory
                setFeedParams={() => { }} // Có thể để hàm rỗng nếu không dùng
                category={category}
                setCategory={setCategory}
            />
            <div className={`container ${sidebar ? '' : 'large-container'}`}>
                <div className="account-page">
                    {accountData && (
                        <div className="account-info">
                            <img className="avatar" src={accountData.avatar} alt={accountData.name} />
                            <h2>{accountData.name}</h2>
                            <p>{accountData.accountdescribe}</p>
                            <p>Đăng ký: {accountData.subscription}</p>
                        </div>
                    )}

                    <div className="video-list">
                        {videos.map(video => (
                            <div key={video.videoid} className="video-card">
                                <img src={video.thumbnail} alt={video.title} />
                                <div className="video-details">
                                    <h4>{video.title}</h4>
                                    <p>{video.videoview} lượt xem</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Account;
