import React from 'react';
import './Home.scss';
import SideBar from '../../components/SideBar/SideBar';
import Feed from '../../components/Feed/Feed';

const Home = ({ sidebar }) => {
    const [category, setCategory] = React.useState(0);

    return (
        <>
            <SideBar sidebar={sidebar} category={category} setCategory={setCategory} />
            <div className={`container ${sidebar ? '' : 'large-container'}`}>
                <Feed category={category} />
            </div>
        </>
    );
};

export default Home;