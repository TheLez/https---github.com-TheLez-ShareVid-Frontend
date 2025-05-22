import React from 'react';

const VideoPlayer = ({ video }) => {
    return (
        <>
            <video src={video.video} controls autoPlay />
            <h3>{video.title}</h3>
        </>
    );
};

export default VideoPlayer;