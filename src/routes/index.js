import Home from '../pages/Home/Home'
import History from '../pages/History'
import NotFound from '../pages/NotFound'

export const routes = [
    {
        path: '/',
        page: Home,
        isShowHeader: true
    },
    {
        path: '/history',
        page: History,
        isShowHeader: true
    },
    {
        path: '*',
        page: NotFound
    }
]