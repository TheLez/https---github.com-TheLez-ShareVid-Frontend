import React, { useState } from 'react';

const CommentForm = ({ onSubmit }) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(newComment);
        setNewComment('');
    };

    return (
        <form className='comment-form' onSubmit={handleSubmit}>
            <input
                type='text'
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder='Nhập bình luận...'
                required
                maxLength={500}
            />
            <button type='submit'>Gửi</button>
        </form>
    );
};

export default CommentForm;