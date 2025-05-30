import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import './Edit.scss';
import StudioSideBar from '../../components/SideBar/StudioSideBar';

const Edit = ({ sidebar, setSidebar }) => {
    const [videoFile, setVideoFile] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePropsArray, setImagePropsArray] = useState([]);
    const [textInputs, setTextInputs] = useState([]);
    const [textPropsArray, setTextPropsArray] = useState([]);
    const [audioFile, setAudioFile] = useState(null);
    const [audioProps, setAudioProps] = useState({ startTime: 0, endTime: 5 });
    const [videoSize] = useState({ width: 640, height: 360 });
    const [nativeSize, setNativeSize] = useState({ width: 0, height: 0 });
    const [videoDuration, setVideoDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(null);
    const [speed, setSpeed] = useState(1);
    const [volume, setVolume] = useState(1);
    const [outputUrl, setOutputUrl] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [videoScaleData, setVideoScaleData] = useState({ scale: 1, paddingLeft: 0, paddingTop: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [message, setMessage] = useState('');
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(4);
    const [tempText, setTempText] = useState(''); // State tạm thời để lưu giá trị nhập liệu

    const defaultImageProps = { x: 0, y: 0, width: 100, height: 100, startTime: 0, endTime: 5 };
    const defaultTextProps = { text: 'Text', x: 0, y: 0, fontsize: 48, fontcolor: '#FFFFFF', startTime: 0, endTime: 5 };

    const calculateVideoScale = (videoWidth, videoHeight) => {
        const frameWidth = videoSize.width;
        const frameHeight = videoSize.height;
        const scaleWidth = frameWidth / videoWidth;
        const scaleHeight = frameHeight / videoHeight;
        const scale = Math.min(scaleWidth, scaleHeight);

        const scaledVideoWidth = videoWidth * scale;
        const scaledVideoHeight = videoHeight * scale;
        const paddingLeft = (frameWidth - scaledVideoWidth) / 2;
        const paddingTop = (frameHeight - scaledVideoHeight) / 2;

        return { scale, paddingLeft, paddingTop };
    };

    const adjustImagePosition = (imageProps, scaleData) => {
        if (!imageProps || !scaleData) return null;
        const { x, y, width, height } = imageProps;
        const { scale, paddingLeft, paddingTop } = scaleData;

        return {
            x_display: paddingLeft + (x * scale),
            y_display: paddingTop + (y * scale),
            width_display: width * scale,
            height_display: height * scale,
        };
    };

    const adjustTextPosition = (textProps, scaleData) => {
        if (!textProps || !scaleData) return null;
        const { x, y, fontsize } = textProps;
        const { scale, paddingLeft, paddingTop } = scaleData;

        return {
            x_display: paddingLeft + (x * scale),
            y_display: paddingTop + (y * scale),
            fontsize_display: fontsize * scale,
        };
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setVideoFile(file);
        const video = videoRef.current;
        try {
            video.src = URL.createObjectURL(file);
            video.onloadedmetadata = () => {
                const { videoWidth, videoHeight, duration } = video;
                setNativeSize({ width: videoWidth, height: videoHeight });
                setVideoDuration(duration);
                setEndTime(duration);
                const scaleData = calculateVideoScale(videoWidth, videoHeight);
                setVideoScaleData(scaleData);
                setSelectedItem({ type: 'video', file });
            };
        } catch (error) {
            console.error('Lỗi khi tạo URL cho video:', error);
            alert('Có lỗi xảy ra khi tải video. Vui lòng thử lại với file hợp lệ.');
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles((prev) => [...prev, ...files]);
        setImagePropsArray((prev) => [
            ...prev,
            ...files.map(() => ({ ...defaultImageProps })),
        ]);
        setSelectedItem({ type: `image${imageFiles.length + 1}`, file: files[files.length - 1] });
    };

    const handleRemoveImage = (index) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePropsArray((prev) => prev.filter((_, i) => i !== index));
        setSelectedItem(null);
    };

    const handleTextInput = (e, index) => {
        const newText = e.target.value;
        setTempText(newText); // Lưu giá trị nhập liệu vào state tạm thời
    };

    const handleTextUpdate = (index) => {
        if (index >= textPropsArray.length) return;

        setTextInputs((prev) => {
            const updated = [...prev];
            updated[index] = tempText;
            return updated;
        });
        setTextPropsArray((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], text: tempText };
            return updated;
        });
        setSelectedItem({ type: `text${index + 1}`, text: tempText });
    };

    const handleAddText = () => {
        if (!videoFile) {
            alert('Vui lòng tải video lên trước khi thêm văn bản để xem trước chính xác.');
            return;
        }
        setTextInputs((prev) => [...prev, 'Text']);
        setTextPropsArray((prev) => [...prev, { ...defaultTextProps }]);
        setSelectedItem({ type: `text${textInputs.length + 1}`, text: 'Text' });
    };

    const handleRemoveText = (index) => {
        setTextInputs((prev) => prev.filter((_, i) => i !== index));
        setTextPropsArray((prev) => prev.filter((_, i) => i !== index));
        setSelectedItem(null);
    };

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        setAudioFile(file);
        setSelectedItem({ type: 'audio', file });
        setAudioLoaded(false);
    };

    const handleCancelAllFiles = () => {
        setVideoFile(null);
        setImageFiles([]);
        setImagePropsArray([]);
        setTextInputs([]);
        setTextPropsArray([]);
        setAudioFile(null);
        setAudioProps({ startTime: 0, endTime: 5 });
        setSelectedItem(null);
        setNativeSize({ width: 0, height: 0 });
        setVideoDuration(0);
        setStartTime(0);
        setEndTime(null);
        setSpeed(1);
        setVolume(1);
        setOutputUrl(null);
        setMessage('');
        if (videoRef.current) {
            videoRef.current.src = '';
        }
        if (audioRef.current) {
            audioRef.current.src = '';
        }
    };

    useEffect(() => {
        if (audioFile && audioRef.current) {
            const audio = audioRef.current;
            audio.src = URL.createObjectURL(audioFile);
            audio.load();

            const onCanPlay = () => {
                setAudioLoaded(true);
                console.log('Audio đã sẵn sàng để phát');
            };

            audio.addEventListener('canplay', onCanPlay);

            return () => {
                audio.removeEventListener('canplay', onCanPlay);
            };
        }
    }, [audioFile]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
        if (audioRef.current) {
            audioRef.current.playbackRate = 1;
        }
    }, [speed]);

    const handleImageChange = (e, index) => {
        if (index >= imagePropsArray.length) return;

        const { name, value } = e.target;
        const newValue = parseFloat(value);
        const maxEndTime = endTime || videoDuration;

        if (name === 'endTime' && newValue > maxEndTime) {
            alert(`Thời gian kết thúc không được vượt quá thời gian video (${maxEndTime}s)`);
            return;
        }

        if (name === 'x') {
            const maxX = nativeSize.width - imagePropsArray[index].width;
            if (newValue < 0 || newValue > maxX) {
                alert(`Tọa độ X phải nằm trong khoảng 0 đến ${maxX}`);
                return;
            }
        }

        if (name === 'y') {
            const maxY = nativeSize.height - imagePropsArray[index].height;
            if (newValue < 0 || newValue > maxY) {
                alert(`Tọa độ Y phải nằm trong khoảng 0 đến ${maxY}`);
                return;
            }
        }

        if (name === 'width') {
            const maxWidth = nativeSize.width - imagePropsArray[index].x;
            if (newValue < 10 || newValue > maxWidth) {
                alert(`Chiều rộng phải nằm trong khoảng 10 đến ${maxWidth}`);
                return;
            }
        }

        if (name === 'height') {
            const maxHeight = nativeSize.height - imagePropsArray[index].y;
            if (newValue < 10 || newValue > maxHeight) {
                alert(`Chiều cao phải nằm trong khoảng 10 đến ${maxHeight}`);
                return;
            }
        }

        setImagePropsArray((prev) => {
            const newProps = [...prev];
            newProps[index] = { ...newProps[index], [name]: newValue };
            return newProps;
        });
    };

    const handleTextChange = (e, index) => {
        if (index >= textPropsArray.length) return;

        const { name, value } = e.target;
        const newValue = name === 'text' || name === 'fontcolor' ? value : parseFloat(value);
        const maxEndTime = endTime || videoDuration;

        if (name === 'endTime' && newValue > maxEndTime) {
            alert(`Thời gian kết thúc không được vượt quá thời gian video (${maxEndTime}s)`);
            return;
        }

        if (name === 'startTime' && newValue < 0) {
            alert(`Thời gian bắt đầu không được nhỏ hơn 0`);
            return;
        }

        if (name === 'x') {
            const maxX = nativeSize.width;
            if (newValue < 0 || newValue > maxX) {
                alert(`Tọa độ X phải nằm trong khoảng 0 đến ${maxX}`);
                return;
            }
        }

        if (name === 'y') {
            const maxY = nativeSize.height;
            if (newValue < 0 || newValue > maxY) {
                alert(`Tọa độ Y phải nằm trong khoảng 0 đến ${maxY}`);
                return;
            }
        }

        if (name === 'fontsize') {
            if (newValue < 10) {
                alert(`Kích thước chữ phải lớn hơn 10`);
                return;
            }
        }

        setTextPropsArray((prev) => {
            const newProps = [...prev];
            newProps[index] = { ...newProps[index], [name]: newValue };
            return newProps;
        });
    };

    const handleAudioChange = (e) => {
        const { name, value } = e.target;
        const newValue = parseFloat(value);
        const maxEndTime = endTime || videoDuration;

        if (name === 'endTime' && newValue > maxEndTime) {
            alert(`Thời gian kết thúc không được vượt quá thời gian video (${maxEndTime}s)`);
            return;
        }

        if (name === 'startTime' && newValue < 0) {
            alert(`Thời gian bắt đầu không được nhỏ hơn 0`);
            return;
        }

        setAudioProps((prev) => ({ ...prev, [name]: newValue }));
    };

    const processVideo = async () => {
        if (!videoFile) {
            alert('Vui lòng chọn video trước khi xử lý.');
            return;
        }

        setIsProcessing(true);
        setMessage('');
        const formData = new FormData();
        formData.append('video', videoFile);
        imageFiles.forEach((file) => {
            formData.append('images', file);
        });
        if (audioFile) formData.append('audio', audioFile);
        formData.append('params', JSON.stringify({
            startTime,
            endTime,
            speed,
            volume,
            imagePropsArray: imageFiles.length > 0 ? imagePropsArray : [],
            textPropsArray: textInputs.length > 0 ? textPropsArray : [],
            audioProps: audioFile ? audioProps : null,
        }));

        try {
            const response = await axiosInstance.post('/ffmpeg/process', formData, {
                responseType: 'blob',
            });

            const blob = response.data;
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'output.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setMessage('Xử lý video thành công!');
        } catch (error) {
            console.error('Lỗi xử lý video:', error);
            alert('Có lỗi xảy ra khi xử lý video. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePlay = async () => {
        if (!videoFile) {
            alert('Vui lòng chọn video trước khi chạy.');
            return;
        }

        setIsPlaying(true);
        const video = videoRef.current;

        if (video.paused) {
            try {
                video.currentTime = 0;
                video.playbackRate = speed;
                await video.play();

                if (audioFile && audioRef.current) {
                    const audio = audioRef.current;
                    if (!audioLoaded) {
                        await new Promise((resolve) => {
                            const onCanPlay = () => {
                                setAudioLoaded(true);
                                audio.removeEventListener('canplay', onCanPlay);
                                resolve();
                            };
                            audio.addEventListener('canplay', onCanPlay);
                        });
                    }

                    audio.currentTime = audioProps.startTime || 0;
                    audio.playbackRate = 1;
                    await audio.play();
                }
            } catch (error) {
                console.error('Lỗi khi phát video hoặc audio:', error);
                setIsPlaying(false);
            }
        }
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        setCurrentTime(video.currentTime);

        if (audioFile && audioRef.current) {
            const audio = audioRef.current;
            const { startTime: audioStart, endTime: audioEnd } = audioProps;

            if (currentTime < audioStart || currentTime > audioEnd) {
                if (!audio.paused) {
                    audio.pause();
                }
            } else if (currentTime >= audioStart && currentTime <= audioEnd) {
                if (audio.paused && isPlaying) {
                    audio.currentTime = currentTime - audioStart;
                    audio.play();
                }
            }
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const items = [
        videoFile && { type: 'video', file: videoFile },
        ...imageFiles.map((file, index) => ({ type: `image${index + 1}`, file })),
        ...textInputs.map((text, index) => ({ type: `text${index + 1}`, text })),
        audioFile && { type: 'audio', file: audioFile },
    ].filter(Boolean);

    const adjustedImages = imageFiles.map((_, index) => {
        if (index < imagePropsArray.length) {
            return adjustImagePosition(imagePropsArray[index], videoScaleData);
        }
        return null;
    });

    const adjustedTexts = textInputs.map((_, index) => {
        if (index < textPropsArray.length) {
            return adjustTextPosition(textPropsArray[index], videoScaleData);
        }
        return null;
    });

    const shouldShowImage = (index) => {
        if (index >= imagePropsArray.length) return false;
        const { startTime, endTime } = imagePropsArray[index];
        return currentTime >= startTime && currentTime <= endTime;
    };

    const shouldShowText = (index) => {
        if (index >= textPropsArray.length) return false;
        const { startTime, endTime } = textPropsArray[index];
        return !isPlaying || (currentTime >= startTime && currentTime <= endTime);
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
            <div className="edit-page-container">
                <div className="edit-page-main-content">
                    <div className="edit-page-video-container">
                        <video
                            ref={videoRef}
                            width={videoSize.width}
                            height={videoSize.height}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={handleEnded}
                        />
                        {imageFiles.map((imageFile, index) => (
                            shouldShowImage(index) && adjustedImages[index] && (
                                <img
                                    key={index}
                                    src={URL.createObjectURL(imageFile)}
                                    style={{
                                        position: 'absolute',
                                        width: adjustedImages[index].width_display,
                                        height: adjustedImages[index].height_display,
                                        top: adjustedImages[index].y_display,
                                        left: adjustedImages[index].x_display,
                                    }}
                                    alt={`Overlay ${index + 1}`}
                                />
                            )
                        ))}
                        {textInputs.map((text, index) => (
                            shouldShowText(index) && adjustedTexts[index] && text && (
                                <div
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: adjustedTexts[index].y_display,
                                        left: adjustedTexts[index].x_display,
                                        fontSize: adjustedTexts[index].fontsize_display,
                                        fontFamily: 'Times New Roman',
                                        color: textPropsArray[index].fontcolor,
                                        whiteSpace: 'nowrap',
                                        lineHeight: 'normal',
                                        margin: 0,
                                        padding: 0,
                                        border: 0,
                                    }}
                                >
                                    {text}
                                </div>
                            )
                        ))}
                        {audioFile && (
                            <audio ref={audioRef} style={{ display: 'none' }} />
                        )}
                    </div>
                    <div className="edit-page-controls">
                        <div>
                            <h3>Tải lên tệp</h3>
                            <label>
                                <span>Chọn file video:</span>
                                <input type="file" accept="video/*" onChange={handleVideoUpload} />
                            </label>
                            <label>
                                <span>Chọn file hình ảnh:</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    multiple
                                />
                            </label>
                            <label>
                                <span>Chọn file âm thanh:</span>
                                <input type="file" accept="audio/*" onChange={handleAudioUpload} />
                            </label>
                            <button onClick={handleAddText}>
                                Thêm văn bản
                            </button>
                        </div>
                        <button onClick={handlePlay}>
                            Chạy
                        </button>
                        <button onClick={processVideo} disabled={isProcessing || !videoFile}>
                            {isProcessing ? 'Đang xử lý...' : 'Xử lý Video'}
                        </button>
                        {message && (
                            <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>
                        )}
                    </div>
                </div>
                <div className="edit-page-sidebar">
                    <h3>Tệp đã thêm</h3>
                    {items.length === 0 ? (
                        <p>Chưa có tệp nào được thêm.</p>
                    ) : (
                        <>
                            <ul>
                                {items.map((item, index) => (
                                    <li
                                        key={index}
                                        className={selectedItem === item ? 'edit-page-selected' : ''}
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        {item.file?.name || item.text || 'Unknown'} ({item.type})
                                        {(item.type.startsWith('image') || item.type.startsWith('text')) && (
                                            <button
                                                onClick={() => {
                                                    if (item.type.startsWith('image')) {
                                                        handleRemoveImage(index - (videoFile ? 1 : 0));
                                                    } else if (item.type.startsWith('text')) {
                                                        handleRemoveText(index - (videoFile ? 1 : 0) - imageFiles.length);
                                                    }
                                                }}
                                                style={{ marginLeft: '10px', color: 'red' }}
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {selectedItem && (
                        <div className="edit-page-item-controls">
                            {selectedItem.type === 'video' && (
                                <div>
                                    <h4>Video: {selectedItem.file?.name || 'Unknown'}</h4>
                                    <p>Độ phân giải video gốc: {nativeSize.width}x{nativeSize.height}</p>
                                    <p>Độ phân giải khung: {videoSize.width}x{videoSize.height}</p>
                                    <label>
                                        Thời gian bắt đầu (s):
                                        <input
                                            type="number"
                                            value={startTime}
                                            onChange={(e) => setStartTime(parseFloat(e.target.value))}
                                            min="0"
                                            max={videoDuration}
                                        />
                                    </label>
                                    <label>
                                        Thời gian kết thúc (s):
                                        <input
                                            type="number"
                                            value={endTime || ''}
                                            onChange={(e) => setEndTime(parseFloat(e.target.value) || null)}
                                            min={startTime}
                                            max={videoDuration}
                                            placeholder="Cuối video"
                                        />
                                    </label>
                                    <label>
                                        Tốc độ:
                                        <input
                                            type="number"
                                            value={speed}
                                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                            min="0.5"
                                            max="2"
                                            step="0.1"
                                        />
                                    </label>
                                    <label>
                                        Âm lượng:
                                        <input
                                            type="number"
                                            value={volume}
                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                            min="0"
                                            max="2"
                                            step="0.1"
                                        />
                                    </label>
                                </div>
                            )}
                            {selectedItem.type.startsWith('image') && (
                                <div>
                                    <h4>Ảnh {selectedItem.type.replace('image', '')}: {selectedItem.file?.name || 'Unknown'}</h4>
                                    <p>Độ phân giải video gốc: {nativeSize.width}x{nativeSize.height} (dùng để đặt vị trí và kích thước)</p>
                                    <label>
                                        Tọa độ X:
                                        <input
                                            type="number"
                                            name="x"
                                            value={imagePropsArray[selectedItem.type.replace('image', '') - 1]?.x || 0}
                                            onChange={(e) => handleImageChange(e, selectedItem.type.replace('image', '') - 1)}
                                            min="0"
                                        />
                                    </label>
                                    <label>
                                        Tọa độ Y:
                                        <input
                                            type="number"
                                            name="y"
                                            value={imagePropsArray[selectedItem.type.replace('image', '') - 1]?.y || 0}
                                            onChange={(e) => handleImageChange(e, selectedItem.type.replace('image', '') - 1)}
                                            min="0"
                                        />
                                    </label>
                                    <label>
                                        Chiều rộng:
                                        <input
                                            type="number"
                                            name="width"
                                            value={imagePropsArray[selectedItem.type.replace('image', '') - 1]?.width || 100}
                                            onChange={(e) => handleImageChange(e, selectedItem.type.replace('image', '') - 1)}
                                            min="10"
                                        />
                                    </label>
                                    <label>
                                        Chiều cao:
                                        <input
                                            type="number"
                                            name="height"
                                            value={imagePropsArray[selectedItem.type.replace('image', '') - 1]?.height || 100}
                                            onChange={(e) => handleImageChange(e, selectedItem.type.replace('image', '') - 1)}
                                            min="10"
                                        />
                                    </label>
                                    <label>
                                        Thời gian bắt đầu (s):
                                        <input
                                            type="number"
                                            name="startTime"
                                            value={imagePropsArray[selectedItem.type.replace('image', '') - 1]?.startTime || 0}
                                            onChange={(e) => handleImageChange(e, selectedItem.type.replace('image', '') - 1)}
                                            min="0"
                                            max={videoDuration}
                                        />
                                    </label>
                                    <label>
                                        Thời gian kết thúc (s):
                                        <input
                                            type="number"
                                            name="endTime"
                                            value={imagePropsArray[selectedItem.type.replace('image', '') - 1]?.endTime || 5}
                                            onChange={(e) => handleImageChange(e, selectedItem.type.replace('image', '') - 1)}
                                            min={imagePropsArray[selectedItem.type.replace('image', '') - 1]?.startTime || 0}
                                            max={endTime || videoDuration}
                                        />
                                    </label>
                                </div>
                            )}
                            {selectedItem.type.startsWith('text') && (
                                <div>
                                    <h4>Văn bản {selectedItem.type.replace('text', '')}: {selectedItem.text || 'Trống'}</h4>
                                    <p>Độ phân giải video gốc: {nativeSize.width}x{nativeSize.height} (dùng để đặt vị trí và kích thước)</p>
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        Nội dung văn bản:
                                        <input
                                            type="text"
                                            name="text"
                                            value={tempText}
                                            onChange={(e) => handleTextInput(e, selectedItem.type.replace('text', '') - 1)}
                                        />
                                        <button
                                            onClick={() => handleTextUpdate(selectedItem.type.replace('text', '') - 1)}
                                            style={{ padding: '2px 5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', width: 'fit-content' }}
                                        >
                                            OK
                                        </button>
                                    </label>
                                    <label>
                                        Tọa độ X:
                                        <input
                                            type="number"
                                            name="x"
                                            value={textPropsArray[selectedItem.type.replace('text', '') - 1]?.x || 0}
                                            onChange={(e) => handleTextChange(e, selectedItem.type.replace('text', '') - 1)}
                                            min="0"
                                        />
                                    </label>
                                    <label>
                                        Tọa độ Y:
                                        <input
                                            type="number"
                                            name="y"
                                            value={textPropsArray[selectedItem.type.replace('text', '') - 1]?.y || 0}
                                            onChange={(e) => handleTextChange(e, selectedItem.type.replace('text', '') - 1)}
                                            min="0"
                                        />
                                    </label>
                                    <label>
                                        Kích thước chữ:
                                        <input
                                            type="number"
                                            name="fontsize"
                                            value={textPropsArray[selectedItem.type.replace('text', '') - 1]?.fontsize || 48}
                                            onChange={(e) => handleTextChange(e, selectedItem.type.replace('text', '') - 1)}
                                            min="10"
                                        />
                                    </label>
                                    <label>
                                        Màu chữ:
                                        <input
                                            type="color"
                                            name="fontcolor"
                                            value={textPropsArray[selectedItem.type.replace('text', '') - 1]?.fontcolor || '#FFFFFF'}
                                            onChange={(e) => handleTextChange(e, selectedItem.type.replace('text', '') - 1)}
                                        />
                                    </label>
                                    <label>
                                        Thời gian bắt đầu (s):
                                        <input
                                            type="number"
                                            name="startTime"
                                            value={textPropsArray[selectedItem.type.replace('text', '') - 1]?.startTime || 0}
                                            onChange={(e) => handleTextChange(e, selectedItem.type.replace('text', '') - 1)}
                                            min="0"
                                            max={videoDuration}
                                        />
                                    </label>
                                    <label>
                                        Thời gian kết thúc (s):
                                        <input
                                            type="number"
                                            name="endTime"
                                            value={textPropsArray[selectedItem.type.replace('text', '') - 1]?.endTime || 5}
                                            onChange={(e) => handleTextChange(e, selectedItem.type.replace('text', '') - 1)}
                                            min={textPropsArray[selectedItem.type.replace('text', '') - 1]?.startTime || 0}
                                            max={endTime || videoDuration}
                                        />
                                    </label>
                                </div>
                            )}
                            {selectedItem.type === 'audio' && (
                                <div>
                                    <h4>Âm thanh: {selectedItem.file?.name || 'Unknown'}</h4>
                                    <label>
                                        Thời gian kết thúc (s):
                                        <input
                                            type="number"
                                            name="endTime"
                                            value={audioProps.endTime}
                                            onChange={handleAudioChange}
                                            min={0}
                                            max={endTime || videoDuration}
                                        />
                                    </label>
                                    <p>Âm thanh sẽ được phát từ đầu video đến giây thứ {audioProps.endTime}.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Edit;