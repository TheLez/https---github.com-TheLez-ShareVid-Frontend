// ... giữ nguyên các import
import React, { useEffect, useState } from 'react';
import './PlayVideo.scss';
import axiosInstance from '../../utils/axiosInstance';
import like from '../../assets/images/like.png';
import dislike from '../../assets/images/dislike.png';
import share from '../../assets/images/share.png';
import save from '../../assets/images/save.png';
import tech from '../../assets/images/tech.png';
import timeAgo from '../../utils/timeAgo';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../authContext';

const PlayVideo = () => {
    const { user } = useAuth();
    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [userLike, setUserLike] = useState(null);
    const { videoId } = useParams();

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(`/video/${videoId}`);
                if (response.status === 200) {
                    setVideo(response.data);
                    await updateViewCount();
                    setUserLike(null); // Reset trước
                    await checkUserLike();
                } else {
                    setError("Video không tồn tại.");
                }
            } catch (error) {
                console.error("Lỗi khi lấy video:", error);
                setError("Không thể tải video.");
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [videoId]);

    const updateViewCount = async () => {
        try {
            await axiosInstance.post(`/video/${videoId}/increment-view`);
        } catch (error) {
            console.error("Lỗi khi cập nhật lượt xem:", error);
        }
    };

    const fetchComments = async () => {
        if (!video) return;
        try {
            const response = await axiosInstance.get(`/comment/video/${video.videoid}`);
            if (response.data?.data) {
                setComments(response.data.data);
            }
        } catch (error) {
            console.error("Lỗi khi lấy bình luận:", error);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [video]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await axiosInstance.post(`/comment/comment/${video.videoid}`, {
                content: newComment,
                userid: user.userid,
            });

            if (response.status === 201) {
                await fetchComments();
                setNewComment('');
            }
        } catch (error) {
            console.error("Lỗi khi thêm bình luận:", error);
        }
    };

    const checkUserLike = async () => {
        try {
            const response = await axiosInstance.get(`/likevideo/video/${videoId}`);
            if (response.data) {
                setUserLike(response.data.type); // 1: like, 0: dislike
            }
        } catch (error) {
            console.error("Lỗi khi kiểm tra trạng thái like:", error);
        }
    };

    const handleLike = async () => {
        try {
            if (userLike === 1) {
                await axiosInstance.delete(`/likevideo/unlike/${videoId}`);
                setUserLike(null);
                setVideo(prev => ({ ...prev, videolike: prev.videolike - 1 }));
            } else {
                if (userLike === 0) {
                    await axiosInstance.delete(`/likevideo/unlike/${videoId}`);
                    setVideo(prev => ({ ...prev, videodislike: prev.videodislike - 1 }));
                }
                await axiosInstance.post(`/likevideo/like/${videoId}`, {
                    userid: user.userid,
                    type: 1,
                });
                setUserLike(1);
                setVideo(prev => ({ ...prev, videolike: prev.videolike + 1 }));
            }
        } catch (error) {
            console.error("Lỗi khi thực hiện like:", error);
        }
    };

    const handleDislike = async () => {
        try {
            if (userLike === 0) {
                await axiosInstance.delete(`/likevideo/unlike/${videoId}`);
                setUserLike(null);
                setVideo(prev => ({ ...prev, videodislike: prev.videodislike - 1 }));
            } else {
                if (userLike === 1) {
                    await axiosInstance.delete(`/likevideo/unlike/${videoId}`);
                    setVideo(prev => ({ ...prev, videolike: prev.videolike - 1 }));
                }
                await axiosInstance.post(`/likevideo/like/${videoId}`, {
                    userid: user.userid,
                    type: 0,
                });
                setUserLike(0);
                setVideo(prev => ({ ...prev, videodislike: prev.videodislike + 1 }));
            }
        } catch (error) {
            console.error("Lỗi khi thực hiện dislike:", error);
        }
    };

    const handleReport = () => {
        console.log('Video đã được báo cáo.');
    };

    if (loading) return <div>Đang tải...</div>;
    if (error) return <div>Lỗi: {error}</div>;
    if (!video) return <div>Video không tồn tại.</div>;

    return (
        <div className='play-video'>
            <video src={video.video} controls autoPlay></video>
            <h3>{video.title}</h3>
            <div className='play-video-info'>
                <p>{video.videoview} lượt xem &bull; {timeAgo(video.created_at)}</p>
                <div>
                    <span onClick={handleLike} className={`icon ${userLike === 1 ? 'active' : ''}`}>
                        <img src={like} alt='Thích' />
                        {video.videolike}
                    </span>
                    <span onClick={handleDislike} className={`icon ${userLike === 0 ? 'active' : ''}`}>
                        <img src={dislike} alt='Không thích' />
                        {video.videodislike}
                    </span>
                    <span><img src={share} alt='Chia sẻ' />Chia sẻ</span>
                    <span><img src={save} alt='Lưu' />Lưu</span>
                    <span onClick={handleReport} className='report-button'>
                        <img src={tech} alt='Báo cáo' />Báo cáo
                    </span>
                </div>
            </div>
            <hr />
            <div className='publisher'>
                <img src={video.Account.avatar} alt='' />
                <div>
                    <p>{video.Account.name}</p>
                    <span>{video.Account.subscription} người đăng ký</span>
                </div>
                <button>Đăng ký</button>
            </div>
            <div className='vid-description'>
                <p>{video.videodescribe || "Không có mô tả."}</p>
                <hr />
                <h4>{comments.length} bình luận</h4>
                {comments.map((comment) => (
                    <div className='comment' key={comment.commentid}>
                        <img src={comment.Account.avatar} alt='' />
                        <div>
                            <h3>{comment.Account.name} <span>{timeAgo(comment.created_at)}</span></h3>
                            <p>{comment.content}</p>
                            <div className='comment-action'>
                                <img src={like} alt='Thích' />
                                <span>244</span>
                                <img src={dislike} alt='Không thích' />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <form className='comment-form' onSubmit={handleCommentSubmit}>
                <input
                    type='text'
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder='Nhập bình luận...'
                    required
                />
                <button type='submit'>Gửi</button>
            </form>
        </div>
    );
};

export default PlayVideo;
