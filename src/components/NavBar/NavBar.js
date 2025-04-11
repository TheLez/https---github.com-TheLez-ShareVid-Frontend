import React, { useState } from 'react';
import { Form, Icon, Image, Input, Menu } from 'semantic-ui-react';
import './NavBar.scss';
import logo from '../../assets/images/logo.jpg';
import menu_icon from '../../assets/images/menu.png';
import search_icon from '../../assets/images/search.png';
import upload_icon from '../../assets/images/upload.png';
import blogs_icon from '../../assets/images/blogs.png';
import notification_icon from '../../assets/images/notification.png';
import profile_icon from '../../assets/images/jack.png';
import { Link, useNavigate } from 'react-router-dom';

const NavBar = () => {
    return (
        <nav className="flex-div">
            <div className="nav-left flex-div">
                <img className='menu-icon' src={menu_icon} alt="" />
                <img className='logo' src={logo} alt="" />
            </div>

            <div className="nav-middle flex-div">
                <div className='search-box flex-div'>
                    <input type='text' placeholder='Tìm kiếm...' />
                    <img src={search_icon} alt="" />
                </div>
            </div>

            <div className="nav-right flex-div">
                <img src={upload_icon} alt="" />
                <img src={blogs_icon} alt="" />
                <img src={notification_icon} alt="" />
                <img src={profile_icon} className='user-icon' alt="" />
            </div>
        </nav>
    )
};

export default NavBar;