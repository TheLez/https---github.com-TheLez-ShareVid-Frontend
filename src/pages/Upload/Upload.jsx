import React, { useState } from 'react';
import { useAuth } from '../../authContext';
import axiosInstance from '../../utils/axiosInstance';
import SideBar from '../../components/SideBar/SideBar';
import './Upload.scss';

const Upload = ({ sidebar, setSidebar }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        videodescribe: '',
        videotype: 0,
    });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(11);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'videotype' ? parseInt(value) : value,
        }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === 'video') {
            setVideoFile(files[0] || null);
        } else if (name === 'thumbnail') {
            setThumbnailFile(files[0] || null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.id) {
            setError('Vui lòng đăng nhập để tải video.');
            return;
        }
        if (!formData.title.trim()) {
            setError('Tiêu đề không được để trống.');
            return;
        }
        if (!videoFile) {
            setError('Vui lòng chọn file video.');
            return;
        }
        if (![0, 1, 2, 3, 4].includes(formData.videotype)) {
            setError('Thể loại không hợp lệ.');
            return;
        }
        if (thumbnailFile && !['image/jpeg', 'image/png'].includes(thumbnailFile.type)) {
            setError('Thumbnail phải là ảnh JPG hoặc PNG.');
            return;
        }
        if (!['video/mp4', 'video/webm'].includes(videoFile.type)) {
            setError('Video phải là định dạng MP4 hoặc WebM.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const uploadData = new FormData();
            uploadData.append('title', formData.title);
            uploadData.append('videodescribe', formData.videodescribe);
            uploadData.append('videotype', formData.videotype);
            uploadData.append('video', videoFile);
            if (thumbnailFile) {
                uploadData.append('thumbnail', thumbnailFile);
            }

            console.log('Upload payload:', {
                title: formData.title,
                videodescribe: formData.videodescribe,
                videotype: formData.videotype,
                video: videoFile?.name,
                thumbnail: thumbnailFile?.name,
            }); // Debug

            const response = await axiosInstance.post('/video/upload', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Upload response:', response.data); // Debug

            if (response.data.status === 'ERROR') {
                throw new Error(response.data.message);
            }

            setSuccess('Tải video lên thành công!');
            setFormData({ title: '', videodescribe: '', videotype: 0 });
            setVideoFile(null);
            setThumbnailFile(null);
            e.target.reset(); // Reset form
        } catch (err) {
            console.error('❌ Lỗi khi tải video:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Không thể tải video.';
            setError(`Lỗi: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const typeOptions = [
        { value: 0, label: 'Không có' },
        { value: 1, label: 'Âm nhạc' },
        { value: 2, label: 'Trò chơi' },
        { value: 3, label: 'Tin tức' },
        { value: 4, label: 'Thể thao' },
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
            <div className="upload">
                <h2>Tải video lên</h2>
                {!user?.id && <p className="error">Vui lòng đăng nhập để tải video.</p>}
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="form-group">
                        <label htmlFor="title">Tiêu đề *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="video">Video * (MP4, WebM)</label>
                        <input
                            type="file"
                            id="video"
                            name="video"
                            accept="video/mp4,video/webm"
                            onChange={handleFileChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="thumbnail">Thumbnail (JPG, PNG, tùy chọn)</label>
                        <input
                            type="file"
                            id="thumbnail"
                            name="thumbnail"
                            accept="image/jpeg,image/png"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="videotype">Thể loại</label>
                        <select
                            id="videotype"
                            name="videotype"
                            value={formData.videotype}
                            onChange={handleInputChange}
                            disabled={loading}
                        >
                            {typeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="videodescribe">Mô tả</label>
                        <textarea
                            id="videodescribe"
                            name="videodescribe"
                            value={formData.videodescribe}
                            onChange={handleInputChange}
                            rows="4"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" disabled={loading || !user?.id}>
                            {loading ? 'Đang tải...' : 'Tải lên'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Upload;