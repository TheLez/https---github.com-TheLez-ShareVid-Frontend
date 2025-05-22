import Home from '../pages/Home/Home';
import Login from '../pages/Login/Login'; // Thêm import cho Login
import Register from '../pages/Register/Register'; // Thêm import cho Register
import Video from '../pages/Video/Video'; // Thêm import cho Video
import Search from '../pages/Search/Search';
import Account from '../pages/Account/Account';
import Watched from '../pages/Watched/Watched';
import Saved from '../pages/Saved/Saved';
import LikeVideo from '../pages/LikeVideo/LikeVideo';
import SubscribeList from '../pages/SubscribeList/SubscribeList';
import Notification from '../pages/Notification/Notification';
import MyProfile from '../pages/MyProfile/MyProfile';
import ManageAccount from '../pages/ManageAccount/ManageAccount';
import ManageVideo from '../pages/ManageVideo/ManageVideo';
import Upload from '../pages/Upload/Upload';

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
    },
    {
        path: '/video/:videoId', // Thêm route cho Video
        page: Video,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/search', // Thêm route cho Video
        page: Search,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/account/:id', // Thêm route cho Video
        page: Account,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/watched', // Thêm route cho Video
        page: Watched,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/saved', // Thêm route cho Video
        page: Saved,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/liked', // Thêm route cho Video
        page: LikeVideo,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/subscribed', // Thêm route cho Video
        page: SubscribeList,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/manage-account', // Thêm route cho Video 
        page: ManageAccount,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/manage-video', // Thêm route cho Video 
        page: ManageVideo,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/notification', // Thêm route cho Video 
        page: Notification,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/my-profile', // Thêm route cho Video 
        page: MyProfile,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    },
    {
        path: '/upload', // Thêm route cho Video 
        page: Upload,
        isShowHeader: true // Hoặc false tùy thuộc vào yêu cầu của bạn
    }
];