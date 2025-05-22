import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MyProfile.scss';
import SideBar from '../../components/SideBar/SideBar';
import axiosInstance from '../../utils/axiosInstance';
import timeAgo from '../../utils/timeAgo';
import { useAuth } from '../../authContext';

const MyProfile = ({ sidebar, setSidebar }) => {
    const { user } = useAuth();
    const [accountData, setAccountData] = useState(null);
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all'); // Thêm state cho mục lọc
    const [formData, setFormData] = useState({
        name: '',
        avatar: null,
        accountdescribe: '',
        gender: '',
        birth: ''
    });
    const [avatarPreview, setAvatarPreview] = useState('');
    const [formError, setFormError] = useState(null);
    const LIMIT = 20;

    // Ánh xạ gender
    const mapGenderToForm = (dbGender) => {
        if (dbGender === 1) return 'male';
        if (dbGender === 0) return 'female';
        return '';
    };

    const mapGenderToDB = (formGender) => {
        if (formGender === 'male') return 1;
        if (formGender === 'female') return 0;
        return null;
    };

    useEffect(() => {
        setSidebar(true);
    }, [setSidebar]);

    // Fetch thông tin tài khoản
    useEffect(() => {
        const fetchAccount = async () => {
            try {
                if (!user?.id) throw new Error('User not authenticated');
                const res = await axiosInstance.get(`/account/get-account/${user.id}`);
                const account = res.data.data.account;
                setAccountData(account);
                setFormData({
                    name: account.name,
                    avatar: null,
                    accountdescribe: account.accountdescribe || '',
                    gender: mapGenderToForm(account.gender),
                    birth: account.birth ? new Date(account.birth).toISOString().split('T')[0] : ''
                });
                setAvatarPreview(account.avatar || '');
                setError(null);
            } catch (err) {
                console.error('Error fetching account:', err);
                setError(err.response?.data?.error || 'Không thể tải thông tin tài khoản.');
            }
        };

        fetchAccount();
    }, [user]);

    // Reset và fetch video khi thay đổi page hoặc filter
    useEffect(() => {
        const controller = new AbortController();
        const fetchVideos = async (retryCount = 0) => {
            setLoading(true);
            try {
                const query = new URLSearchParams({
                    page: page.toString(),
                    limit: LIMIT.toString(),
                    ...(selectedFilter !== 'all' && { status: selectedFilter === 'public' ? '1' : '0' })
                }).toString();

                console.log(`Fetching videos for account ${user.id}, query=${query}, retry=${retryCount}`);
                const res = await axiosInstance.get(`/video/my-profile/${user.id}?${query}`, {
                    signal: controller.signal
                });
                const newVideos = res.data.data || [];
                console.log('Fetched videos:', newVideos.map(v => v.videoid));

                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.videoid));
                    const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.videoid));
                    return page === 1 ? uniqueNewVideos : [...prev, ...uniqueNewVideos];
                });

                setHasMore(newVideos.length === LIMIT);
                setError(null);
            } catch (err) {
                if (err.name === 'AbortError') {
                    console.log('Fetch videos aborted for account:', user.id);
                } else if (retryCount < 1) {
                    console.log('Retrying fetch videos for account:', user.id);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await fetchVideos(retryCount + 1);
                }
                // } else {
                //     console.error('Error fetching videos:', err);
                //     setError(err.response?.data?.error || 'Không thể tải video.');
                // }
            } finally {
                setLoading(false);
            }
        };

        if (page === 1) {
            console.log('Resetting state for account:', user.id);
            setVideos([]);
            setHasMore(true);
            setError(null);
        }

        fetchVideos();

        return () => {
            controller.abort();
        };
    }, [user, page, selectedFilter]); // Thêm selectedFilter vào dependencies

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
                hasMore &&
                !loading
            ) {
                console.log('Scrolling: Increasing page to', page + 1);
                setPage(prev => prev + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading, page]);

    // Xử lý chọn mục lọc
    const handleFilterChange = (filter) => {
        setSelectedFilter(filter);
        setPage(1); // Reset page khi đổi filter
        setVideos([]); // Reset danh sách video
        setHasMore(true);
    };

    // Xử lý form chỉnh sửa
    const handleEditClick = () => {
        setShowEditForm(true);
        setFormError(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setFormError('Ảnh đại diện không được lớn hơn 2MB.');
                return;
            }
            setFormData(prev => ({ ...prev, avatar: file }));
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setFormError('Tên tài khoản không được để trống.');
            return;
        }
        if (!formData.gender) {
            setFormError('Vui lòng chọn giới tính.');
            return;
        }
        if (formData.birth && new Date(formData.birth) > new Date()) {
            setFormError('Ngày sinh không được là tương lai.');
            return;
        }

        try {
            console.log('Updating account:', formData);
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('accountdescribe', formData.accountdescribe);
            formDataToSend.append('gender', mapGenderToDB(formData.gender));
            formDataToSend.append('birth', formData.birth);
            if (formData.avatar) {
                formDataToSend.append('avatar', formData.avatar);
            }

            for (let [key, value] of formDataToSend.entries()) {
                console.log(`FormData ${key}:`, value);
            }

            const res = await axiosInstance.patch('/account/update', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setAccountData(res.data.data.account);
            setShowEditForm(false);
            setFormError(null);
            setFormData(prev => ({ ...prev, avatar: null }));
            setAvatarPreview(res.data.data.account.avatar);
        } catch (err) {
            console.error('Error updating account:', err);
            setFormError(err.response?.data?.error || 'Không thể cập nhật thông tin.');
        }
    };

    const handleFormCancel = () => {
        setShowEditForm(false);
        setFormError(null);
        setFormData({
            name: accountData?.name || '',
            avatar: null,
            accountdescribe: accountData?.accountdescribe || '',
            gender: mapGenderToForm(accountData?.gender),
            birth: accountData?.birth ? new Date(accountData?.birth).toISOString().split('T')[0] : ''
        });
        setAvatarPreview(accountData?.avatar || '');
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
                <div className="my-profile-page">
                    {error && <p className="error">{error}</p>}
                    {accountData ? (
                        <div className="account-info">
                            <img className="avatar" src={accountData.avatar} alt={accountData.name} />
                            <h2>{accountData.name}</h2>
                            <p>{accountData.accountdescribe || 'Chưa có mô tả.'}</p>
                            <p>Đăng ký: {accountData.subscription}</p>
                            <button className="edit-button" onClick={handleEditClick}>
                                Cập nhật thông tin
                            </button>
                        </div>
                    ) : (
                        <p>Đang tải thông tin tài khoản...</p>
                    )}

                    {showEditForm && (
                        <div className="edit-form-modal">
                            <div className="edit-form-content">
                                <h3>Chỉnh sửa thông tin tài khoản</h3>
                                <form onSubmit={handleFormSubmit}>
                                    <div className="form-group">
                                        <label>Tên tài khoản</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ảnh đại diện</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                        {avatarPreview && (
                                            <img
                                                src={avatarPreview}
                                                alt="Preview"
                                                className="avatar-preview"
                                            />
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Giới tính</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ngày sinh</label>
                                        <input
                                            type="date"
                                            name="birth"
                                            value={formData.birth}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả</label>
                                        <textarea
                                            name="accountdescribe"
                                            value={formData.accountdescribe}
                                            onChange={handleFormChange}
                                            rows="4"
                                        />
                                    </div>
                                    {formError && <p className="error">{formError}</p>}
                                    <div className="form-actions">
                                        <button type="submit">Lưu</button>
                                        <button type="button" onClick={handleFormCancel}>Hủy</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="video-filters">
                        <button
                            className={`filter-button ${selectedFilter === 'all' ? 'active' : ''}`}
                            onClick={() => handleFilterChange('all')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`filter-button ${selectedFilter === 'public' ? 'active' : ''}`}
                            onClick={() => handleFilterChange('public')}
                        >
                            Công khai
                        </button>
                        <button
                            className={`filter-button ${selectedFilter === 'private' ? 'active' : ''}`}
                            onClick={() => handleFilterChange('private')}
                        >
                            Riêng tư
                        </button>
                    </div>

                    <div className="video-list">
                        {loading && videos.length === 0 ? (
                            <p>Đang tải video...</p>
                        ) : videos.length === 0 ? (
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
                    {loading && videos.length > 0 && <p>Đang tải thêm...</p>}
                </div>
            </div>
        </>
    );
};

export default MyProfile;