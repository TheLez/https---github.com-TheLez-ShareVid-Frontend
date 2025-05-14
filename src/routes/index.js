import Home from '../pages/Home/Home';
import Login from '../pages/Login/Login'; // Thêm import cho Login
import Register from '../pages/Register/Register'; // Thêm import cho Register

export const routes = [
    {
        path: '/',
        page: Home,
        isShowHeader: true
    },
    {
        path: '/login',
        page: Login, // Thêm route cho Login
        isShowHeader: false // Nếu không cần hiển thị header
    },
    {
        path: '/register',
        page: Register, // Thêm route cho Register
        isShowHeader: false // Nếu không cần hiển thị header
    }
];