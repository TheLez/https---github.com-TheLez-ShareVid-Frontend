import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './store'; // Sửa import từ { store } thành store
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>

);

// Nếu bạn muốn bắt đầu đo lường hiệu suất trong ứng dụng của mình, 
// hãy truyền một hàm để ghi lại kết quả (ví dụ: reportWebVitals(console.log))
// hoặc gửi đến một endpoint phân tích.
reportWebVitals();