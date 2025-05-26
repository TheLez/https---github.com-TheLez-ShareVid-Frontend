import React, { useEffect, useState } from 'react';
import RecordCanvas from '../../components/RecordCanvas/RecordCanvas';
import ScreenRecorder from '../../components/ScreenRecorder/ScreenRecorder';
import StudioSideBar from '../../components/SideBar/StudioSideBar';
import './Record.scss';

const Record = ({ sidebar, setSidebar }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(3);
    const [selectedMode, setSelectedMode] = useState('webcam');

    useEffect(() => {
        setSidebar(true);
    }, [setSidebar]);

    const handleRecordingStart = () => {
        setIsRecording(true);
    };

    const handleRecordingStop = () => {
        setIsRecording(false);
    };

    const handleModeChange = (e) => {
        setSelectedMode(e.target.value);
    };

    return (
        <>
            <StudioSideBar
                sidebar={sidebar}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                setFeedParams={() => { }}
                category={category}
                setCategory={setCategory}
            />
            <div className="record-page">
                <div className="header-section">
                    <div className="mode-selector">
                        <select value={selectedMode} onChange={handleModeChange} disabled={isRecording}>
                            <option value="webcam">Ghi hình webcam</option>
                            <option value="screen">Ghi hình màn hình</option>
                        </select>
                    </div>
                </div>
                {selectedMode === 'webcam' ? (
                    <RecordCanvas
                        onRecordingStart={handleRecordingStart}
                        onRecordingStop={handleRecordingStop}
                    />
                ) : (
                    <ScreenRecorder
                        onRecordingStart={handleRecordingStart}
                        onRecordingStop={handleRecordingStop}
                    />
                )}
            </div>
        </>
    );
};

export default Record;