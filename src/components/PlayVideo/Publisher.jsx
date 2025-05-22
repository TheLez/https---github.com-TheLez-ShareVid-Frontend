import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Publisher.scss';

const Publisher = ({ video, user, isSubscribed, handleSubscribe, handleStatusToggle, handleUpdateVideo, handleDeleteVideo }) => {
    const isOwner = user && video && String(user.id) === String(video.Account.userid);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: video.title || '',
        videodescribe: video.videodescribe || '',
        videotype: video.videotype || 0,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            console.log('Input change:', { name, value });
            return {
                ...prev,
                [name]: name === 'videotype' ? parseInt(value) : value,
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Submit payload:', formData);
        handleUpdateVideo(video.videoid, formData);
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (!window.confirm('Bạn có chắc muốn xóa video này?')) return;
        console.log('Deleting video:', video.videoid);
        handleDeleteVideo(video.videoid);
        setIsModalOpen(false);
    };

    return (
        <div className="publisher">
            <Link to={`/account/${video.Account.userid}`}>
                <img src={video.Account.avatar || '/path/to/default-avatar.png'} alt="" />
                <div>
                    <p>{video.Account.name}</p>
                    <span>{video.Account.subscription} người đăng ký</span>
                </div>
            </Link>

            {isOwner ? (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="update-button"
                >
                    Cập nhật thông tin
                </button>
            ) : (
                <button
                    onClick={handleSubscribe}
                    className={`subscribe-button ${isSubscribed ? 'subscribed' : ''}`}
                >
                    {isSubscribed ? 'Đã đăng ký' : 'Đăng ký'}
                </button>
            )}

            {isOwner && (
                <div className="video-status">
                    <span
                        onClick={handleStatusToggle}
                        className={`status-toggle ${video.status === 1 ? 'public' : 'private'}`}
                    >
                        Trạng thái: {video.status === 1 ? 'Công khai' : 'Riêng tư'}
                    </span>
                </div>
            )}

            {isModalOpen && isOwner && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Cập nhật thông tin video</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="title">Tiêu đề</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="videodescribe">Mô tả</label>
                                <textarea
                                    id="videodescribe"
                                    name="videodescribe"
                                    value={formData.videodescribe}
                                    onChange={handleInputChange}
                                    rows="4"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="videotype">Thể loại</label>
                                <select
                                    id="videotype"
                                    name="videotype"
                                    value={formData.videotype}
                                    onChange={handleInputChange}
                                >
                                    <option value={0}>Không có</option>
                                    <option value={1}>Âm nhạc</option>
                                    <option value={2}>Trò chơi</option>
                                    <option value={3}>Tin tức</option>
                                    <option value={4}>Thể thao</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="submit">Lưu</button>
                                <button type="button" onClick={handleDelete} className="delete-button">
                                    Xóa
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-button">
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Publisher;