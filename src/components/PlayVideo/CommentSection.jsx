import React, { useEffect, useRef, useCallback } from 'react';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

const CommentSection = ({
    video,
    user,
    comments,
    defaultAvatar,
    page,
    hasMore,
    isFetching,
    fetchComments,
    handleCommentSubmit,
    handleUpdateComment,
    handleDeleteComment,
    handleCommentLike,
    handleCommentDislike
}) => {
    const observer = useRef();
    const fetchTimeout = useRef(null);

    useEffect(() => {
        if (video && !comments.length && hasMore) {
            fetchComments(1);
        }
    }, [video, comments.length, hasMore, fetchComments]);

    const lastCommentRef = useCallback(node => {
        if (isFetching) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isFetching) {
                if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
                fetchTimeout.current = setTimeout(() => {
                    fetchComments(page + 1);
                }, 500);
            }
        }, { threshold: 0.1 });

        if (node) observer.current.observe(node);
    }, [isFetching, hasMore, page, fetchComments]);

    return (
        <div className='vid-description'>
            <p>{video.videodescribe || "Không có mô tả."}</p>
            <hr />
            <h4>{comments.length} bình luận</h4>
            <CommentForm onSubmit={handleCommentSubmit} />
            {comments.map((comment, index) => (
                <CommentItem
                    key={comment.commentid}
                    comment={comment}
                    user={user}
                    defaultAvatar={defaultAvatar}
                    isLast={index === comments.length - 1}
                    lastCommentRef={lastCommentRef}
                    handleUpdateComment={handleUpdateComment}
                    handleDeleteComment={handleDeleteComment}
                    handleCommentLike={handleCommentLike}
                    handleCommentDislike={handleCommentDislike}
                />
            ))}
            {comments.length === 0 && hasMore && isFetching && (
                <div className="comment-placeholder">Đang tải bình luận...</div>
            )}
            {isFetching && comments.length > 0 && <p>Đang tải thêm bình luận...</p>}
        </div>
    );
};

export default CommentSection;