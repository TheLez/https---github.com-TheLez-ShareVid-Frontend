import React from 'react'
import './PlayVideo.scss'
import video1 from '../../assets/videos/video.mp4'
import like from '../../assets/images/like.png'
import dislike from '../../assets/images/dislike.png'
import share from '../../assets/images/share.png'
import save from '../../assets/images/save.png'
import jack from '../../assets/images/jack.png'
import user_profile from '../../assets/images/user_profile.jpg'

const PlayVideo = () => {
    return (
        <div className='play-video'>
            <video src={video1} controls autoPlay muted></video>
            <h3>Best YouTube Channel To Learn Web Development</h3>
            <div className='play-video-info'>
                <p>1525 lượt xem &bull; 2 ngày trước</p>
                <div>
                    <span><img src={like} alt='' />125</span>
                    <span><img src={dislike} alt='' />2</span>
                    <span><img src={share} alt='' />Chia sẻ</span>
                    <span><img src={save} alt='' />Lưu</span>
                </div>
            </div>
            <hr />
            <div className='publisher'>
                <img src={jack} alt='' />
                <div>
                    <p>GreatStack</p>
                    <span>1Tr người đăng ký</span>
                </div>
                <button>Đăng ký</button>
            </div>
            <div className='vid-description'>
                <p>Channel that makes learning Easy</p>
                <p>Subscribe GreateStack to Watch More Tutorials on web development</p>
                <hr />
                <h4>130 bình luận</h4>
                <div className='comment'>
                    <img src={user_profile} alt='' />
                    <div>
                        <h3>Jack Nicholson <span>1 ngày trước</span></h3>
                        <p>A global computer network providing a variety of information and facilities, consisting
                            of interconnected networks using standardized communication protocols.</p>
                        <div className='comment-action'>
                            <img src={like} alt='' />
                            <span>244</span>
                            <img src={dislike} alt='' />
                        </div>
                    </div>
                </div>
                <div className='comment'>
                    <img src={user_profile} alt='' />
                    <div>
                        <h3>Jack Nicholson <span>1 ngày trước</span></h3>
                        <p>A global computer network providing a variety of information and facilities, consisting
                            of interconnected networks using standardized communication protocols.</p>
                        <div className='comment-action'>
                            <img src={like} alt='' />
                            <span>244</span>
                            <img src={dislike} alt='' />
                        </div>
                    </div>
                </div>
                <div className='comment'>
                    <img src={user_profile} alt='' />
                    <div>
                        <h3>Jack Nicholson <span>1 ngày trước</span></h3>
                        <p>A global computer network providing a variety of information and facilities, consisting
                            of interconnected networks using standardized communication protocols.</p>
                        <div className='comment-action'>
                            <img src={like} alt='' />
                            <span>244</span>
                            <img src={dislike} alt='' />
                        </div>
                    </div>
                </div>
                <div className='comment'>
                    <img src={user_profile} alt='' />
                    <div>
                        <h3>Jack Nicholson <span>1 ngày trước</span></h3>
                        <p>A global computer network providing a variety of information and facilities, consisting
                            of interconnected networks using standardized communication protocols.</p>
                        <div className='comment-action'>
                            <img src={like} alt='' />
                            <span>244</span>
                            <img src={dislike} alt='' />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PlayVideo
