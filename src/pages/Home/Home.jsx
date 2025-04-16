import React from 'react';
import './Home.scss';
import SideBar from '../../components/SideBar/SideBar';
import Feed from '../../components/Feed/Feed';

const Home = ({ sidebar }) => {
    return (
        <>
            <SideBar sidebar={sidebar} />
            <div className={`container ${sidebar ? '' : 'large-container'}`}>
                <Feed />
            </div>
        </>
    );
};

export default Home;