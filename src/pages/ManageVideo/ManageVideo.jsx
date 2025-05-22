import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce'; // Thêm use-debounce
import './ManageVideo.scss';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../authContext';
import SideBar from '../../components/SideBar/SideBar';

const ManageVideo = ({ sidebar, setSidebar }) => {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(11);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 2000); // Debounce 500ms
    const [formData, setFormData] = useState({
        title: '',
        videodescribe: '',
        videotype: 0,
        status: 1
    });
    const [formError, setFormError] = useState(null);
    const LIMIT = 10;

    // Fetch danh sách video
    useEffect(() => {
        const fetchVideos = async () => {
            if (!user?.id) {
                setError('Vui lòng đăng nhập để quản lý video.');
                return;
            }
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page,
                    limit: LIMIT,
                    ...(debouncedSearchQuery && { search: debouncedSearchQuery }) // Dùng debouncedSearchQuery
                });
                console.log('Fetch videos params:', params.toString()); // Debug
                const response = await axiosInstance.get(`/video/get-all?${params}`);
                console.log('Fetch videos response:', response.data); // Debug
                const fetchedVideos = Array.isArray(response.data.data) ? response.data.data : [];
                setVideos(fetchedVideos);
                setTotalPages(response.data.totalPages || 1);
                setError(null);
            } catch (err) {
                console.error('❌ Lỗi khi lấy danh sách video:', err);
                setError(err.response?.data?.error || 'Không thể tải danh sách video.');
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [user, page, debouncedSearchQuery]); // Dùng debouncedSearchQuery

    // Xử lý tìm kiếm
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1); // Reset về trang 1 khi tìm kiếm
    };

    const handleSearchClear = () => {
        setSearchQuery('');
        setPage(1);
    };

    // Xử lý click vào video
    const handleVideoClick = (video) => {
        setSelectedVideo(video);
        setFormData({
            title: video.title || '',
            videodescribe: video.videodescribe || '',
            videotype: video.videotype || 0,
            status: video.status || 1
        });
        setFormError(null);
    };

    // Xử lý thay đổi form
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'videotype' || name === 'status' ? parseInt(value) : value
        }));
    };

    // Xử lý submit form
    const handleUpdateVideo = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setFormError('Tiêu đề không được để trống.');
            return;
        }
        if (![0, 1, 2, 3, 4].includes(formData.videotype)) {
            setFormError('Thể loại không hợp lệ.');
            return;
        }
        if (![0, 1].includes(formData.status)) {
            setFormError('Trạng thái không hợp lệ.');
            return;
        }

        try {
            const payload = {
                title: formData.title,
                videodescribe: formData.videodescribe,
                videotype: formData.videotype,
                status: formData.status
            };
            console.log('Update video payload:', payload); // Debug
            const response = await axiosInstance.put(`/video/update/${selectedVideo.videoid}`, payload);
            console.log('Update video response:', response.data); // Debug

            if (typeof response.data !== 'object' || !response.data.videoid) {
                throw new Error(`Dữ liệu video cập nhật không hợp lệ: ${JSON.stringify(response.data)}`);
            }

            setVideos(prev => {
                const updatedVideos = prev.map(v =>
                    v.videoid === selectedVideo.videoid
                        ? { ...v, ...response.data }
                        : v
                );
                console.log('Updated videos:', updatedVideos); // Debug
                return [...updatedVideos];
            });

            setSelectedVideo(null);
            setFormError(null);
            alert('Cập nhật video thành công!');
        } catch (err) {
            console.error('❌ Lỗi khi cập nhật video:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Không thể cập nhật video.';
            setFormError(`Lỗi: ${errorMessage}`);
        }
    };

    // Xử lý xóa video
    const handleDeleteVideo = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa video này?')) return;

        try {
            const response = await axiosInstance.delete(`/video/delete/${selectedVideo.videoid}`);
            if (response.status === 200) {
                setVideos(prev => prev.filter(v => v.videoid !== selectedVideo.videoid));
                setSelectedVideo(null);
                alert('Xóa video thành công!');
            }
        } catch (err) {
            console.error('❌ Lỗi khi xóa video:', err);
            setFormError(err.response?.data?.error || 'Không thể xóa video.');
        }
    };

    // Xử lý chuyển trang
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // Đóng form
    const handleCloseForm = () => {
        setSelectedVideo(null);
        setFormError(null);
    };

    // Ánh xạ type và status
    const typeOptions = [
        { value: 0, label: 'Không có' },
        { value: 1, label: 'Âm nhạc' },
        { value: 2, label: 'Trò chơi' },
        { value: 3, label: 'Tin tức' },
        { value: 4, label: 'Thể thao' }
    ];

    const statusOptions = [
        { value: 1, label: 'Công khai' },
        { value: 0, label: 'Riêng tư' }
    ];

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
            <div className="manage-video">
                <h2>Quản lý video</h2>
                <div className="search-bar">
                    <input
                        key="search-input" // Thêm key để đảm bảo DOM ổn định
                        type="text"
                        placeholder="Tìm kiếm theo ID hoặc tiêu đề..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        disabled={loading}
                    />
                    {searchQuery && (
                        <button onClick={handleSearchClear} disabled={loading}>
                            Xóa
                        </button>
                    )}
                </div>
                {error && <p className="error">{error}</p>}
                {loading && !videos.length ? (
                    <p>Đang tải...</p>
                ) : (
                    <>
                        <table className="video-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tiêu đề</th>
                                    <th>Thể loại</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {videos.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            {searchQuery ? 'Không tìm thấy video.' : 'Không có video nào.'}
                                        </td>
                                    </tr>
                                ) : (
                                    videos.map(video => (
                                        <tr
                                            key={video.videoid}
                                            onClick={() => handleVideoClick(video)}
                                            className="video-row"
                                        >
                                            <td>{video.videoid}</td>
                                            <td>{video.title}</td>
                                            <td>{typeOptions.find(t => t.value === video.videotype)?.label || 'Không có'}</td>
                                            <td>{statusOptions.find(s => s.value === video.status)?.label || 'Công khai'}</td>
                                            <td>{new Date(video.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="pagination">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                            >
                                Trang trước
                            </button>
                            <span>Trang {page} / {totalPages}</span>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages || loading}
                            >
                                Trang sau
                            </button>
                        </div>
                    </>
                )}

                {selectedVideo && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Review Video: {selectedVideo.title}</h3>
                            <video
                                controls
                                src={selectedVideo.video}
                                className="video-player"
                                onError={() => alert('Không thể tải video.')}
                            />
                            <form onSubmit={handleUpdateVideo}>
                                <div className="form-group">
                                    <label htmlFor="title">Tiêu đề</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="videodescribe">Mô tả</label>
                                    <textarea
                                        id="videodescribe"
                                        name="videodescribe"
                                        value={formData.videodescribe}
                                        onChange={handleFormChange}
                                        rows="4"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="videotype">Thể loại</label>
                                    <select
                                        id="videotype"
                                        name="videotype"
                                        value={formData.videotype}
                                        onChange={handleFormChange}
                                    >
                                        {typeOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="status">Trạng thái</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {formError && <p className="error">{formError}</p>}
                                <div className="form-actions">
                                    <button type="submit">Xác nhận sửa</button>
                                    <button type="button" onClick={handleDeleteVideo}>
                                        Xóa video
                                    </button>
                                    <button type="button" onClick={handleCloseForm}>
                                        Đóng
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ManageVideo;