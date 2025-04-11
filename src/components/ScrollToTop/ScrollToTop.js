import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = ({ children }) => {
    const location = useLocation();

    useEffect(() => {
        // Khi location thay đổi, cuộn lên đầu trang.
        window.scrollTo(0, 0);
    }, [location]); // Chạy hiệu ứng khi location thay đổi.

    return children;
};

export default ScrollToTop;