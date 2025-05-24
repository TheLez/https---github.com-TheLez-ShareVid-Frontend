import React, { useState, useEffect, useRef } from 'react';
import './Timeline.scss';

const Timeline = ({ videoFile, imageFile, audioFile }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoFile) {
            videoRef.current = document.querySelector('video');
            videoRef.current.ontimeupdate = () => {
                setCurrentTime(videoRef.current.currentTime);
            };
        }
    }, [videoFile]);

    const duration = videoRef.current?.duration || 100;
    const playheadPosition = (currentTime / duration) * 100;

    return (
        <div className="timeline">
            <div className="track video-track">
                <div className="segment" style={{ width: '100%' }}>
                    {videoFile?.name || 'No Video'}
                </div>
            </div>
            <div className="track image-track">
                {imageFile && (
                    <div className="segment" style={{ width: '20%' }}>
                        {imageFile.name}
                    </div>
                )}
            </div>
            <div className="track audio-track">
                {audioFile && (
                    <div className="segment" style={{ width: '50%' }}>
                        {audioFile.name}
                    </div>
                )}
            </div>
            <div className="playhead" style={{ left: `${playheadPosition}%` }} />
        </div>
    );
};

export default Timeline;