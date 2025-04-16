import React from 'react'
import './SideBar.scss'
import home from '../../assets/images/home.png'
import subscription from '../../assets/images/subscription.png'
import history from '../../assets/images/history.png'
import library from '../../assets/images/library.png'
import like from '../../assets/images/like.png'
import jack from '../../assets/images/jack.png'
import simon from '../../assets/images/simon.png'
import tom from '../../assets/images/tom.png'
import megan from '../../assets/images/megan.png'
import cameron from '../../assets/images/cameron.png'
import explore from '../../assets/images/explore.png'
import music from '../../assets/images/music.png'
import game_icon from '../../assets/images/game_icon.png'
import news from '../../assets/images/news.png'
import sports from '../../assets/images/sports.png'

const SideBar = ({ sidebar }) => {
    return (
        <div className={` sidebar ${sidebar ? '' : 'small-sidebar'}`}>
            <div className='shortcut-links'>
                <div className='side-link'>
                    <img src={home} alt="" /><p>Trang chủ</p>
                </div>
                <div className='side-link'>
                    <img src={subscription} alt="" /><p>Kênh đăng ký</p>
                </div>
                <hr />
                <h3>Bạn</h3>
                <div className='side-link'>
                    <img src={history} alt="" /><p>Video đã xem</p>
                </div>
                <div className='side-link'>
                    <img src={library} alt="" /><p>Danh sách phát</p>
                </div>
                <div className='side-link'>
                    <img src={like} alt="" /><p>Video đã thích</p>
                </div>
                <hr />
            </div>

            <div className='subscribed-list'>
                <h3>Kênh đăng ký</h3>
                <div className='side-link'>
                    <img src={jack} alt="" /><p>Jack</p>
                </div>
                <div className='side-link'>
                    <img src={simon} alt="" /><p>Simon</p>
                </div>
                <div className='side-link'>
                    <img src={tom} alt="" /><p>Tom</p>
                </div>
                <div className='side-link'>
                    <img src={megan} alt="" /><p>Megan</p>
                </div>
                <div className='side-link'>
                    <img src={cameron} alt="" /><p>Cameron</p>
                </div>
                <hr />
            </div>

            <div className='shortcut-links'>
                <h3>Khám phá</h3>
                <div className='side-link'>
                    <img src={explore} alt="" /><p>Thịnh hành</p>
                </div>
                <div className='side-link'>
                    <img src={music} alt="" /><p>Âm nhạc</p>
                </div>
                <div className='side-link'>
                    <img src={game_icon} alt="" /><p>Trò chơi</p>
                </div>
                <div className='side-link'>
                    <img src={news} alt="" /><p>Tin tức</p>
                </div>
                <div className='side-link'>
                    <img src={sports} alt="" /><p>Thể thao</p>
                </div>
                <hr />
            </div>
        </div>
    )
}

export default SideBar
