import React, { useEffect, useState } from 'react';
import './PlayVideo.scss';
import axiosInstance from '../../utils/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext';
import VideoPlayer from './VideoPlayer';
import VideoInfo from './VideoInfo';
import Publisher from './Publisher';
import CommentSection from './CommentSection';

const PlayVideo = ({ onVideoTypeChange }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { videoId } = useParams();

    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLike, setUserLike] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const defaultAvatar = '/path/to/default-avatar.png';

    useEffect(() => {
        console.log('PlayVideo useEffect running for videoId:', videoId);
        // Reset state khi videoId thay đổi
        setVideo(null);
        setComments([]);
        setUserLike(null);
        setIsSubscribed(false);
        setIsSaved(false);
        setPage(1);
        setHasMore(true);
        setError(null);
        setLoading(true);

        const fetchVideo = async () => {
            try {
                console.log('Fetching video:', videoId);
                const response = await axiosInstance.get(`/video/${videoId}`);
                if (response.status === 200) {
                    const videoData = response.data;
                    console.log('Video data:', videoData);
                    // Kiểm tra quyền truy cập
                    if (videoData.status === 0 && (!user?.id || String(user.id) !== String(videoData.Account.userid))) {
                        setError('Bạn không có quyền xem video này.');
                        return;
                    }
                    setVideo(videoData);
                    const videoType = videoData.videoType || videoData.videotype;
                    console.log('Setting videoType:', videoType);
                    if (videoType === undefined || videoType === null) {
                        setError('Không có loại video hợp lệ.');
                    } else {
                        onVideoTypeChange(videoType); // Gọi callback để cập nhật videoType
                    }
                    await updateViewCount();
                    await checkUserLike();
                    await checkSubscribe(videoData.Account.userid);
                    await checkSaved();
                    // Tải bình luận cho video mới
                    console.log('Calling fetchComments for video:', videoData.videoid);
                    await fetchComments(1);
                } else {
                    setError('Video không tồn tại.');
                }
            } catch (error) {
                console.error("❌ Lỗi khi lấy video:", error);
                setError(error.response?.data?.error || 'Không thể tải video.');
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [videoId, user, onVideoTypeChange]);

    const updateViewCount = async () => {
        try {
            await axiosInstance.post(`/video/${videoId}/increment-view`);
        } catch (error) {
            console.error("Lỗi khi cập nhật lượt xem:", error);
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
                    userid: user.id,
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
                    userid: user.id,
                    type: 0,
                });
                setUserLike(0);
                setVideo(prev => ({ ...prev, videodislike: prev.videodislike + 1 }));
            }
        } catch (error) {
            console.error("Lỗi khi thực hiện dislike:", error);
        }
    };

    const checkSubscribe = async (useridsub) => {
        try {
            const response = await axiosInstance.get(`/subscribe/subscribed/${useridsub}`);
            setIsSubscribed(!!response.data.isSubscribed);
        } catch (error) {
            console.error("Lỗi khi kiểm tra trạng thái đăng ký:", error);
            setIsSubscribed(false);
        }
    };

    const handleSubscribe = async () => {
        try {
            if (isSubscribed) {
                await axiosInstance.delete(`/subscribe/delete-subscribe/${video.Account.userid}`);
                setIsSubscribed(false);
                setVideo(prev => ({ ...prev, Account: { ...prev.Account, subscription: prev.Account.subscription - 1 } }));
            } else {
                await axiosInstance.post(`/subscribe/subscribe`, {
                    useridsub: video.Account.userid,
                    userid: user.id,
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
            const response = await axiosInstance.get(`/save-video/saved/${videoId}`);
            setIsSaved(!!response.data.isSaved);
        } catch (error) {
            console.error("Lỗi khi kiểm tra trạng thái lưu video:", error);
            setIsSaved(false);
        }
    };

    const handleSave = async () => {
        try {
            if (isSaved) {
                await axiosInstance.delete(`/save-video/remove/${videoId}`);
                setIsSaved(false);
            } else {
                await axiosInstance.post(`/save-video/save`, {
                    videoid: videoId,
                    userid: user.id,
                });
                setIsSaved(true);
            }
        } catch (error) {
            console.error("Lỗi khi thực hiện lưu/hủy lưu video:", error);
        }
    };

    const handleStatusToggle = async () => {
        try {
            const newStatus = video.status === 1 ? 0 : 1;
            const response = await axiosInstance.put(`/video/update/${video.videoid}`, {
                status: newStatus,
            });
            if (response.status === 200) {
                setVideo(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("❌ Lỗi khi thay đổi trạng thái video:", error);
            alert("Cập nhật trạng thái thất bại.");
        }
    };

    const handleUpdateVideo = async (videoId, { title, videodescribe, videotype }) => {
        if (!user?.id) {
            alert('Vui lòng đăng nhập để cập nhật video');
            return;
        }
        try {
            console.log('Updating video:', { videoId, title, videodescribe, videotype });
            const response = await axiosInstance.put(`/video/update/${videoId}`, {
                title,
                videodescribe,
                videotype,
            });
            console.log('Update video response:', response.data);
            setVideo(prev => ({
                ...prev,
                title,
                videodescribe,
                videotype,
            }));
            alert('Cập nhật thông tin video thành công!');
            onVideoTypeChange(videotype); // Cập nhật videoType khi video được sửa
        } catch (error) {
            console.error('Lỗi khi cập nhật thông tin video:', error.response?.data || error.message);
            alert('Không thể cập nhật thông tin video. Vui lòng thử lại.');
        }
    };

    const handleDeleteVideo = async (videoid) => {
        try {
            console.log('Calling DELETE /video/delete/', videoid);
            const response = await axiosInstance.delete(`/video/delete/${videoid}`);
            console.log('Delete response:', response.status, response.data);
            if ([200, 204].includes(response.status)) {
                console.log('Xóa video thành công, navigating to /');
                window.alert('Xóa video thành công!');
                setVideo(null);
                navigate('/');
            } else {
                console.warn('Unexpected status:', response.status);
                alert('Xóa video thất bại: Status không hợp lệ.');
            }
        } catch (err) {
            console.error('❌ Lỗi khi xóa video:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            alert(err.response?.data?.error || 'Không thể xóa video: ' + err.message);
        }
    };

    const fetchComments = async (currentPage = 1) => {
        if (!video || isFetching || !hasMore) {
            console.log('fetchComments skipped:', { video: !!video, isFetching, hasMore });
            return;
        }

        setIsFetching(true);
        try {
            console.log(`Fetching comments for video ${video.videoid}, page ${currentPage}`);
            const response = await axiosInstance.get(`/comment/video/${video.videoid}?page=${currentPage}&limit=5`);
            const commentsData = Array.isArray(response.data?.data) ? response.data.data : [];
            const totalPages = response.data.totalPages || Infinity;

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

            setComments(prev => (currentPage === 1 ? updatedComments : [...prev, ...updatedComments]));
            setHasMore(currentPage < totalPages && commentsData.length > 0);
            setPage(currentPage);
        } catch (error) {
            console.error(`❌ Error fetching comments, page=${currentPage}:`, error);
            setHasMore(false);
            setError('Không thể tải bình luận.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleCommentSubmit = async (newComment) => {
        if (!newComment.trim() || newComment.length > 500) {
            alert(newComment.length > 500 ? "Bình luận không được vượt quá 500 ký tự." : "Bình luận không được để trống.");
            return;
        }

        try {
            const response = await axiosInstance.post(`/comment/comment/${video.videoid}`, {
                content: newComment,
                userid: user.id,
            });
            if (response.status === 201) {
                const newCommentData = response.data.data || response.data;
                if (!newCommentData.commentid) {
                    throw new Error('Response không chứa dữ liệu bình luận');
                }
                setComments(prev => [{
                    commentid: newCommentData.commentid,
                    content: newComment,
                    Account: {
                        userid: user.id,
                        name: user.name || 'User',
                        avatar: newCommentData.Account?.avatar || user.avatar || defaultAvatar
                    },
                    created_at: new Date().toISOString(),
                    userLike: null
                }, ...prev]);
            }
        } catch (error) {
            console.error("❌ Lỗi khi thêm bình luận:", error);
            alert("Thêm bình luận thất bại.");
        }
    };

    const handleUpdateComment = async (commentId, content) => {
        if (!content.trim() || content.length > 500) {
            alert(content.length > 500 ? "Bình luận không được vượt quá 500 ký tự." : "Nội dung bình luận không được để trống.");
            return;
        }

        try {
            const response = await axiosInstance.put(`/comment/update/${commentId}`, { content });
            if (response.status === 200) {
                const updatedContent = response.data.content || response.data.data?.content || content;
                setComments(prev => prev.map(c =>
                    c.commentid === commentId ? { ...c, content: updatedContent } : c
                ));
            }
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật bình luận:", error);
            alert("Cập nhật bình luận thất bại.");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;

        try {
            const response = await axiosInstance.delete(`/comment/delete/${commentId}`);
            if (response.status === 200) {
                setComments(prev => prev.filter(c => c.commentid !== commentId));
            }
        } catch (error) {
            console.error("❌ Lỗi khi xóa bình luận:", error);
            alert("Xóa bình luận thất bại.");
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
                    userid: user.id,
                    commentid: commentId,
                    type: 1,
                });
            }
            setComments([]);
            setPage(1);
            setHasMore(true);
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
                    userid: user.id,
                    commentid: commentId,
                    type: 0,
                });
            }
            setComments([]);
            setPage(1);
            setHasMore(true);
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
            <VideoPlayer video={video} />
            <VideoInfo
                video={video}
                userLike={userLike}
                isSaved={isSaved}
                handleLike={handleLike}
                handleDislike={handleDislike}
                handleSave={handleSave}
            />
            <hr />
            <Publisher
                video={video}
                user={user}
                isSubscribed={isSubscribed}
                handleSubscribe={handleSubscribe}
                handleStatusToggle={handleStatusToggle}
                handleUpdateVideo={handleUpdateVideo}
                handleDeleteVideo={handleDeleteVideo}
            />
            <CommentSection
                video={video}
                user={user}
                comments={comments}
                defaultAvatar={defaultAvatar}
                page={page}
                hasMore={hasMore}
                isFetching={isFetching}
                fetchComments={fetchComments}
                handleCommentSubmit={handleCommentSubmit}
                handleUpdateComment={handleUpdateComment}
                handleDeleteComment={handleDeleteComment}
                handleCommentLike={handleCommentLike}
                handleCommentDislike={handleCommentDislike}
            />
        </div>
    );
};

export default PlayVideo;