import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/userReducer'; // Đảm bảo đường dẫn đúng

const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

export default store; // Xuất mặc định