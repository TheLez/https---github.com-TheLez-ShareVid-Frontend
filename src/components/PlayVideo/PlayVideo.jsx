import React, { useEffect, useState, useRef, useCallback } from 'react';
import './PlayVideo.scss';
import axiosInstance from '../../utils/axiosInstance';
import like from '../../assets/images/like.png';
import dislike from '../../assets/images/dislike.png';
import share from '../../assets/images/share.png';
import save from '../../assets/images/save.png';
import tech from '../../assets/images/messages.png';
import timeAgo from '../../utils/timeAgo';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../authContext';

const PlayVideo = ({ onVideoTypeChange }) => {
    const { user } = useAuth();
    const { videoId } = useParams();

    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [userLike, setUserLike] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false); // Trạng thái đăng ký
    const [isSaved, setIsSaved] = useState(false); // Trạng thái lưu video

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    const observer = useRef();

    const [reportMenuOpen, setReportMenuOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    const reportReasons = [
        "Vi phạm bản quyền",
        "Nội dung phản cảm",
        "Thông tin sai lệch",
        "Kích động/thù ghét",
        "Quảng bá chủ nghĩa khủng bố",
        "Khác"
    ];

    const handleReport = () => {
        setReportMenuOpen(prev => !prev);
    };

    const submitReport = async () => {
        const reason = selectedReason === 'Khác' ? customReason.trim() : selectedReason;
        if (!reason) {
            alert("Vui lòng chọn hoặc nhập lý do báo cáo.");
            return;
        }

        try {
            await axiosInstance.post('/notification/report', {
                content: `Báo cáo video "${video.title}" (ID: ${video.videoid}): ${reason}`,
            });
            alert("Báo cáo đã được gửi.");
            setReportMenuOpen(false);
            setSelectedReason('');
            setCustomReason('');
        } catch (error) {
            console.error("❌ Lỗi khi gửi báo cáo:", error);
            alert("Gửi báo cáo thất bại.");
        }
    };


    useEffect(() => {
        const fetchVideo = async () => {
            try {
                setLoading(true);
                console.log('▶️ Fetch video by ID:', videoId);
                const response = await axiosInstance.get(`/video/${videoId}`);
                console.log('API response fetchVideo:', response.data);
                if (response.status === 200) {
                    setVideo(response.data);
                    const videoType = response.data.videoType || response.data.videotype;
                    console.log('✅ videoType:', videoType);
                    if (videoType === undefined || videoType === null) {
                        console.warn('⚠️ videoType không tồn tại trong response.data');
                        setError('Không có loại video hợp lệ.');
                    } else {
                        onVideoTypeChange(videoType);
                    }
                    await updateViewCount();
                    await checkUserLike();
                    await checkSubscribe(response.data.Account.userid);
                    await checkSaved();
                } else {
                    setError("Video không tồn tại.");
                }
            } catch (error) {
                console.error("❌ Lỗi khi lấy video:", error);
                setError("Không thể tải video.");
            } finally {
                setLoading(false);
                console.log('fetchVideo kết thúc');
            }
        };

        fetchVideo();
    }, [videoId, onVideoTypeChange]);

    const updateViewCount = async () => {
        try {
            await axiosInstance.post(`/video/${videoId}/increment-view`);
        } catch (error) {
            console.error("Lỗi khi cập nhật lượt xem:", error);
        }
    };

    const checkSubscribe = async (useridsub) => {
        try {
            console.log('🔍 Kiểm tra trạng thái đăng ký:', useridsub);
            const response = await axiosInstance.get(`/subscribe/subscribed/${useridsub}`);
            console.log('API response checkSubscribe:', response.data);
            setIsSubscribed(!!response.data.isSubscribed); // Giả định API trả về { isSubscribed: true/false }
        } catch (error) {
            console.error("Lỗi khi kiểm tra trạng thái đăng ký:", error);
            setIsSubscribed(false);
        }
    };

    const handleSubscribe = async () => {
        try {
            if (isSubscribed) {
                console.log('🔔 Hủy đăng ký:', video.Account.userid);
                await axiosInstance.delete(`/subscribe/delete-subscribe/${video.Account.userid}`);
                setIsSubscribed(false);
                setVideo(prev => ({ ...prev, Account: { ...prev.Account, subscription: prev.Account.subscription - 1 } }));
            } else {
                console.log('🔔 Đăng ký:', video.Account.userid);
                await axiosInstance.post(`/subscribe/subscribe`, {
                    useridsub: video.Account.userid,
                    userid: user.userid,
                });
                setIsSubscribed(true);
                setVideo(prev => ({ ...prev, Account: { ...prev.Account, subscription: prev.Account.subscription + 1 } }));
            }
        } catch (error) {
            console.error("Lỗi khi thực hiện đăng ký/hủy đăng ký:", error);
        }
    };

    const checkSaved = async () => {
        try {
            console.log('🔍 Kiểm tra trạng thái lưu video:', videoId);
            const response = await axiosInstance.get(`/save-video/saved/${videoId}`);
            console.log('API response checkSaved:', response.data);
            setIsSaved(!!response.data.isSaved); // Giả định API trả về { isSaved: true/false }
        } catch (error) {
            console.error("Lỗi khi kiểm tra trạng thái lưu video:", error);
            setIsSaved(false);
        }
    };

    const handleSave = async () => {
        try {
            if (isSaved) {
                console.log('💾 Hủy lưu video:', videoId);
                await axiosInstance.delete(`/save-video/remove/${videoId}`);
                setIsSaved(false);
            } else {
                console.log('💾 Lưu video:', videoId);
                await axiosInstance.post(`/save-video/save`, {
                    videoid: videoId,
                    userid: user.userid,
                });
                setIsSaved(true);
            }
        } catch (error) {
            console.error("Lỗi khi thực hiện lưu/hủy lưu video:", error);
        }
    };

    const fetchComments = async (currentPage = 1, retryCount = 0, maxRetries = 3) => {
        if (!video || isFetching || !hasMore) return;
        if (retryCount >= maxRetries) {
            console.warn(`⚠️ Max retries reached for fetchComments, page=${currentPage}`);
            setHasMore(false);
            setIsFetching(false);
            return;
        }

        setIsFetching(true);
        try {
            console.log(`📦 Fetch comments: videoId=${video.videoid}, page=${currentPage}, retry=${retryCount}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await axiosInstance.get(`/comment/video/${video.videoid}?page=${currentPage}&limit=5`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            console.log('API response fetchComments:', response.data);

            const commentsData = response.data?.data || [];
            console.log('Fetched comment IDs:', commentsData.map(c => c.commentid));

            if (commentsData.length === 0) {
                console.warn(`⚠️ Empty comments for page ${currentPage}, retrying...`);
                setTimeout(() => fetchComments(currentPage, retryCount + 1, maxRetries), 1000);
                return;
            }

            const updatedComments = await Promise.all(commentsData.map(async (comment) => {
                try {
                    const likeResponse = await axiosInstance.get(`/like-comment/like-comment/${comment.commentid}`);
                    return {
                        ...comment,
                        userLike: likeResponse.data ? likeResponse.data.type : null
                    };
                } catch (err) {
                    console.error(`Lỗi khi lấy like cho comment ${comment.commentid}:`, err);
                    return { ...comment, userLike: null };
                }
            }));

            setComments(prev => [...prev, ...updatedComments]);
            setHasMore(commentsData.length === 5);
        } catch (error) {
            console.error(`❌ Error fetching comments, page=${currentPage}:`, error);
            console.warn(`⚠️ Retrying fetchComments... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => fetchComments(currentPage, retryCount + 1, maxRetries), 1000);
        } finally {
            setIsFetching(false);
            console.log('fetchComments kết thúc');
        }
    };

    useEffect(() => {
        if (video) {
            setComments([]);
            setPage(1);
            setHasMore(true);
            fetchComments(1);
        }
    }, [video]);

    const lastCommentRef = useCallback(node => {
        if (isFetching) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isFetching) {
                console.log('⬇️ Gần cuối danh sách bình luận, load page:', page + 1);
                setPage(prevPage => prevPage + 1);
            }
        }, { threshold: 0.1 });

        if (node) observer.current.observe(node);
    }, [isFetching, hasMore]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await axiosInstance.post(`/comment/comment/${video.videoid}`, {
                content: newComment,
                userid: user.userid,
            });

            if (response.status === 201) {
                setPage(1);
                setHasMore(true);
                setNewComment('');
                setComments([]);
                fetchComments(1);
            }
        } catch (error) {
            console.error("Lỗi khi thêm bình luận:", error);
        }
    };

    const checkUserLike = async () => {
        try {
            const response = await axiosInstance.get(`/likevideo/video/${videoId}`);
            if (response.data) {
                setUserLike(response.data.type);
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

    const handleCommentLike = async (commentId) => {
        try {
            const comment = comments.find(c => c.commentid === commentId);

            if (comment.userLike === 1) {
                await axiosInstance.delete(`/like-comment/unlike-comment/${commentId}`);
            } else {
                if (comment.userLike === 0) {
                    await axiosInstance.delete(`/like-comment/unlike-comment/${commentId}`);
                }
                await axiosInstance.post('/like-comment/like-comment', {
                    userid: user.userid,
                    commentid: commentId,
                    type: 1,
                });
            }

            setPage(1);
            setHasMore(true);
            setComments([]);
            fetchComments(1);
        } catch (error) {
            console.error("Lỗi khi thực hiện like bình luận:", error);
        }
    };

    const handleCommentDislike = async (commentId) => {
        try {
            const comment = comments.find(c => c.commentid === commentId);

            if (comment.userLike === 0) {
                await axiosInstance.delete(`/like-comment/unlike-comment/${commentId}`);
            } else {
                if (comment.userLike === 1) {
                    await axiosInstance.delete(`/like-comment/unlike-comment/${commentId}`);
                }
                await axiosInstance.post('/like-comment/like-comment', {
                    userid: user.userid,
                    commentid: commentId,
                    type: 0,
                });
            }

            setPage(1);
            setHasMore(true);
            setComments([]);
            fetchComments(1);
        } catch (error) {
            console.error("Lỗi khi thực hiện dislike bình luận:", error);
        }
    };

    if (loading) return <div>Đang tải...</div>;
    if (error) return <div>Lỗi: {error}</div>;
    if (!video) return <div>Video không tồn tại.</div>;

    return (
        <div className='play-video'>
            <video src={video.video} controls autoPlay></video>
            <h3>{video.title}</h3>
            <div className='play-video-info'>
                <p>{video.videoview} lượt xem • {timeAgo(video.created_at)}</p>
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
                    <span onClick={handleSave} className={`icon ${isSaved ? 'saved' : ''}`}>
                        <img src={save} alt='Lưu' />
                        {isSaved ? 'Đã lưu' : 'Lưu'}
                    </span>
                    <span onClick={handleReport} className='report-button'>
                        <img src={tech} alt='Báo cáo' />Báo cáo
                    </span>
                    {reportMenuOpen && (
                        <div className="report-menu">
                            <h4>Chọn lý do báo cáo</h4>
                            <ul>
                                {reportReasons.map(reason => (
                                    <li key={reason}>
                                        <label>
                                            <input
                                                type="radio"
                                                name="report-reason"
                                                value={reason}
                                                checked={selectedReason === reason}
                                                onChange={(e) => setSelectedReason(e.target.value)}
                                            />
                                            {reason}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                            {selectedReason === 'Khác' && (
                                <textarea
                                    placeholder="Nhập lý do khác..."
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                />
                            )}
                            <button onClick={submitReport}>Gửi báo cáo</button>
                        </div>
                    )}
                </div>
            </div>
            <hr />
            <div className='publisher'>
                <Link to={`/account/${video.Account.userid}`}>
                    <img src={video.Account.avatar} alt='' />
                    <div>
                        <p>{video.Account.name}</p>
                        <span>{video.Account.subscription} người đăng ký</span>
                    </div>
                </Link>
                <button
                    onClick={handleSubscribe}
                    className={`subscribe-button ${isSubscribed ? 'subscribed' : ''}`}
                >
                    {isSubscribed ? 'Đã đăng ký' : 'Đăng ký'}
                </button>
            </div>
            <div className='vid-description'>
                <p>{video.videodescribe || "Không có mô tả."}</p>
                <hr />
                <h4>{comments.length} bình luận</h4>
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
                {comments.map((comment, index) => {
                    const isLast = index === comments.length - 1;
                    return (
                        <div
                            className='comment'
                            key={comment.commentid}
                            ref={isLast ? lastCommentRef : null}
                        >
                            <Link to={`/account/${comment.Account.userid}`}>
                                <img src={comment.Account.avatar} alt='' />
                                <div>
                                    <h3>{comment.Account.name} <span>{timeAgo(comment.created_at)}</span></h3>
                                    <p>{comment.content}</p>
                                    <div className='comment-action'>
                                        <span onClick={() => handleCommentLike(comment.commentid)} className={`icon ${comment.userLike === 1 ? 'active' : ''}`}>
                                            <img src={like} alt='Thích' />
                                        </span>
                                        <span onClick={() => handleCommentDislike(comment.commentid)} className={`icon ${comment.userLike === 0 ? 'active' : ''}`}>
                                            <img src={dislike} alt='Không thích' />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                })}
                {comments.length === 0 && hasMore && (
                    <div ref={lastCommentRef} className="comment-placeholder">
                        {isFetching ? 'Đang tải bình luận...' : 'Tải thêm bình luận...'}
                    </div>
                )}
                {isFetching && comments.length > 0 && <p>Đang tải thêm bình luận...</p>}
            </div>
        </div>
    );
};

export default PlayVideo;