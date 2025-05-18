import React from 'react';
import { useLocation } from 'react-router-dom';

const Search = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('query'); // Lấy giá trị của query

    return (
        <div>
            <h1>Kết quả tìm kiếm cho: {searchQuery}</h1>
            {/* Thêm logic tìm kiếm và hiển thị kết quả tại đây */}
        </div>
    );
};

export default Search;