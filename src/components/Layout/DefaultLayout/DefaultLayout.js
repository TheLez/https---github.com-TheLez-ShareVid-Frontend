import React from 'react';
import Header from '../../NavBar/NavBar';
import ScrollToTop from '../../ScrollToTop/ScrollToTop';
import './DefaultLayout.scss';

export function DefaultLayout(props) {
    return (
        <ScrollToTop>
            <div className='app-layout'>
                <Header />
                {props.children}
            </div>
        </ScrollToTop>
    );
}