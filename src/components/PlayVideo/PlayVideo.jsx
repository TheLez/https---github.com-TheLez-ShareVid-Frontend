import React, { useEffect, useState, useRef, useCallback } from 'react';
import './PlayVideo.scss';
import axiosInstance from '../../utils/axiosInstance';
import like from '../../assets/images/like.png';
import dislike from '../../assets/images/dislike.png';
import share from '../../assets/images/share.png';
import save from '../../assets/images/save.png';
import tech from '../../assets/images/tech.png';
import timeAgo from '../../utils/timeAgo';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../authContext';

const PlayVideo = () => {
    const { user } = useAuth();
    const { videoId } = useParams();

    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [userLike, setUserLike] = useState(null);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    const observer = useRef();

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                setLoading(true);
                console.log('▶️ Fetch video by ID:', videoId);
                const response = await axiosInstance.get(`/video/${videoId}`);
                console.log('API response fetchVideo:', response.data);
                if (response.status === 200) {
                    setVideo(response.data);
                    await updateViewCount();
                    await checkUserLike();
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
    }, [videoId]);

    const updateViewCount = async () => {
        try {
            await axiosInstance.post(`/video/${videoId}/increment-view`);
        } catch (error) {
            console.error("Lỗi khi cập nhật lượt xem:", error);
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
                    <span><img src={save} alt='Lưu' />Lưu</span>
                    <span onClick={handleReport} className='report-button'>
                        <img src={tech} alt='Báo cáo' />Báo cáo
                    </span>
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
                <button>Đăng ký</button>
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