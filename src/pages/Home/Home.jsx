import React, { useEffect, useState } from 'react';
import './Home.scss';
import SideBar from '../../components/SideBar/SideBar';
import Feed from '../../components/Feed/Feed';

const Home = ({ sidebar, setSidebar }) => {
    const [activeCategory, setActiveCategory] = useState(0);
    const [feedParams, setFeedParams] = useState({ type: null, orderByView: false });

    useEffect(() => {
        setSidebar(true);
    }, [setSidebar]);

    return (
        <div className="home">
            <SideBar
                className={`sidebar ${sidebar ? '' : 'sidebar-hidden'}`}
                sidebar={sidebar}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                setFeedParams={setFeedParams}
            />
            <div className={`container ${sidebar ? '' : 'large-container'}`}>
                <Feed
                    type={feedParams.type}
                    orderByView={feedParams.orderByView}
                />
            </div>
        </div>
    );
};

export default Home;