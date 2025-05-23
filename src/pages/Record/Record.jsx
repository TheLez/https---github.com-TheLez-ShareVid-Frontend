import React, { useState, useEffect } from 'react';
import RecordCanvas from '../../components/RecordCanvas/RecordCanvas';
import StudioSideBar from '../../components/SideBar/StudioSideBar';
import './Record.scss';

const Record = ({ sidebar, setSidebar }) => {
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [selectedBackground, setSelectedBackground] = useState('none');
    const [selectedAudio, setSelectedAudio] = useState('none');
    const [isRecording, setIsRecording] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(3);

    useEffect(() => {
        //console.log('Record component rendered');
        //console.log('State - selectedFilter:', selectedFilter);
        //console.log('State - selectedBackground:', selectedBackground);
        //console.log('State - selectedAudio:', selectedAudio);
    }, [selectedFilter, selectedBackground, selectedAudio]);

    const handleRecordingStart = () => {
        //console.log('Starting recording with:', { selectedFilter, selectedBackground, selectedAudio });
        setIsRecording(true);
    };

    const handleRecordingStop = (url) => {
        //console.log('Recording stopped, download URL:', url);
        setIsRecording(false);
        setDownloadUrl(url);
    };

    const handleFilterChange = (e) => {
        console.log('Filter changed to:', e.target.value);
        setSelectedFilter(e.target.value);
    };

    const handleBackgroundChange = (e) => {
        console.log('Background changed to:', e.target.value);
        setSelectedBackground(e.target.value);
    };

    const handleAudioChange = (e) => {
        console.log('Audio changed to:', e.target.value);
        setSelectedAudio(e.target.value);
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
                <h1>Record Video with Filters & Background</h1>
                <RecordCanvas
                    onRecordingStart={handleRecordingStart}
                    onRecordingStop={handleRecordingStop}
                    selectedFilter={selectedFilter}
                    selectedBackground={selectedBackground}
                    selectedAudio={selectedAudio}
                />
                <div className="controls">
                    <select
                        value={selectedFilter}
                        onChange={handleFilterChange}
                        disabled={isRecording}
                    >
                        <option value="none">No Filter</option>
                        <option value="glasses">Glasses</option>
                        <option value="hat">Hat</option>
                    </select>
                    <select
                        value={selectedBackground}
                        onChange={handleBackgroundChange}
                        disabled={isRecording}
                    >
                        <option value="none">No Background</option>
                        <option value="bg1">Beach Background</option>
                        <option value="bg2">City Background</option>
                    </select>
                    <select
                        value={selectedAudio}
                        onChange={handleAudioChange}
                        disabled={isRecording}
                    >
                        <option value="none">No Audio</option>
                        <option value="song1">Song 1</option>
                        <option value="song2">Song 2</option>
                    </select>
                    {downloadUrl && (
                        <a href={downloadUrl} download="recorded-video.webm" className="download-link">
                            Download Video
                        </a>
                    )}
                </div>
            </div>
        </>
    );
};

export default Record;