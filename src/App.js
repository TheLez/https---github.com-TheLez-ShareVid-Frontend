import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { DefaultLayout } from './components/Layout/DefaultLayout/DefaultLayout';
import Home from './pages/Home/Home';
import Video from './pages/Video/Video';

function App() {
  return (
    <div>
      <DefaultLayout />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video/:categoryId/:videoId" element={<Video />} />
      </Routes>
    </div>
  );
}

export default App;
