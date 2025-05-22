import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import like from '../../assets/images/like.png';
import dislike from '../../assets/images/dislike.png';
import threedot from '../../assets/images/threedot.png';
import timeAgo from '../../utils/timeAgo';

const CommentItem = ({
    comment,
    user,
    defaultAvatar,
    isLast,
    lastCommentRef,
    handleUpdateComment,
    handleDeleteComment,
    handleCommentLike,
    handleCommentDislike
}) => {
    const [commentMenu, setCommentMenu] = useState({ show: false, x: 0, y: 0 });
    const [editComment, setEditComment] = useState({ content: '' });
    const isOwnComment = user && comment && String(user.id) === String(comment.Account.userid);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (commentMenu.show && !e.target.closest('.comment-menu')) {
                setCommentMenu({ show: false, x: 0, y: 0 });
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [commentMenu.show]);

    const handleCommentMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCommentMenu({
            show: true,
            x: e.clientX,
            y: e.clientY
        });
    };

    const handleEditComment = () => {
        setEditComment({ content: comment.content });
        setCommentMenu({ show: false, x: 0, y: 0 });
    };

    const handleUpdateSubmit = (e) => {
        e.preventDefault();
        handleUpdateComment(comment.commentid, editComment.content);
        setEditComment({ content: '' });
    };

    return (
        <div className='comment' ref={isLast ? lastCommentRef : null}>
            <div className="comment-header">
                <Link to={`/account/${comment.Account.userid}`} className="comment-user">
                    <img src={comment.Account.avatar || defaultAvatar} alt='' />
                    <h3>
                        {comment.Account.name} <span>{timeAgo(comment.created_at)}</span>
                    </h3>
                </Link>
                {isOwnComment && (
                    <span className="threedot-icon" onClick={handleCommentMenu}>
                        <img src={threedot} alt="Menu" />
                    </span>
                )}
            </div>
            <div className="comment-content">
                {editComment.content ? (
                    <form className="edit-comment-form" onSubmit={handleUpdateSubmit}>
                        <textarea
                            value={editComment.content}
                            onChange={(e) => setEditComment({ ...editComment, content: e.target.value })}
                            placeholder="Chỉnh sửa bình luận..."
                            required
                            maxLength={500}
                        />
                        <div className="edit-comment-actions">
                            <button type="submit">Lưu</button>
                            <button
                                type="button"
                                onClick={() => setEditComment({ content: '' })}
                            >
                                Hủy
                            </button>
                        </div>
                    </form>
                ) : (
                    <p>{comment.content}</p>
                )}
            </div>
            <div className='comment-action'>
                <span
                    onClick={() => handleCommentLike(comment.commentid)}
                    className={`icon ${comment.userLike === 1 ? 'active' : ''}`}
                >
                    <img src={like} alt='Thích' />
                </span>
                <span
                    onClick={() => handleCommentDislike(comment.commentid)}
                    className={`icon ${comment.userLike === 0 ? 'active' : ''}`}
                >
                    <img src={dislike} alt='Không thích' />
                </span>
            </div>
            {commentMenu.show && (
                <div
                    className="comment-menu"
                    style={{ top: commentMenu.y, left: commentMenu.x }}
                    onClick={() => setCommentMenu({ show: false, x: 0, y: 0 })}
                >
                    <ul>
                        <li onClick={handleEditComment}>Chỉnh sửa</li>
                        <li onClick={() => handleDeleteComment(comment.commentid)}>Xóa</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CommentItem;