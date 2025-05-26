import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import './Edit.scss';
import StudioSideBar from '../../components/SideBar/StudioSideBar';

const Edit = ({ sidebar, setSidebar }) => {
    const [videoFile, setVideoFile] = useState(null);
    const [imageFiles, setImageFiles] = useState([]); // Mảng chứa tối đa 3 ảnh
    const [imagePropsArray, setImagePropsArray] = useState([]); // Mảng chứa thông tin của từng ảnh
    const [audioFile, setAudioFile] = useState(null);
    const [audioProps, setAudioProps] = useState({ startTime: 0, endTime: 5 }); // startTime mặc định là 0
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
    const [message, setMessage] = useState(''); // Thông báo xử lý thành công
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const [audioLoaded, setAudioLoaded] = useState(false); // Trạng thái kiểm tra audio đã tải xong
    const [category, setCategory] = useState(0);
    const [activeCategory, setActiveCategory] = useState(4);

    const defaultImageProps = { x: 0, y: 0, width: 100, height: 100, startTime: 0, endTime: 5 };

    useEffect(() => {
        setSidebar(true);
    }, [setSidebar]);

    const calculateVideoScale = (videoWidth, videoHeight) => {
        const frameWidth = videoSize.width;
        const frameHeight = videoSize.height;
        const scaleWidth = videoWidth / frameWidth;
        const scaleHeight = videoHeight / frameHeight;
        const scale = Math.max(scaleWidth, scaleHeight);

        const scaledVideoWidth = videoWidth / scale;
        const scaledVideoHeight = videoHeight / scale;

        const paddingLeft = (frameWidth - scaledVideoWidth) / 2;
        const paddingTop = (frameHeight - scaledVideoHeight) / 2;

        return { scale, paddingLeft, paddingTop };
    };

    const adjustImagePosition = (imageProps, scaleData) => {
        if (!imageProps || !scaleData) return null; // Kiểm tra undefined
        const { x, y, width, height } = imageProps;
        const { scale, paddingLeft, paddingTop } = scaleData;

        return {
            x_display: paddingLeft + (x / scale),
            y_display: paddingTop + (y / scale),
            width_display: width / scale,
            height_display: height / scale,
        };
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        setVideoFile(file);
        const video = videoRef.current;
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
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.slice(0, 3 - imageFiles.length); // Giới hạn tối đa 3 ảnh
        setImageFiles((prev) => [...prev, ...newImages].slice(0, 3));
        setImagePropsArray((prev) => [
            ...prev,
            ...newImages.map(() => ({ ...defaultImageProps })),
        ].slice(0, 3));
        setSelectedItem({ type: `image${imageFiles.length + 1}`, file: newImages[newImages.length - 1] });
    };

    const handleRemoveImage = (index) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePropsArray((prev) => prev.filter((_, i) => i !== index));
        setSelectedItem(null);
    };

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        setAudioFile(file);
        setSelectedItem({ type: 'audio', file });
        setAudioLoaded(false); // Reset trạng thái audioLoaded
    };

    const handleCancelAllFiles = () => {
        setVideoFile(null);
        setImageFiles([]);
        setImagePropsArray([]);
        setAudioFile(null);
        setAudioProps({ startTime: 0, endTime: 5 }); // Đặt lại giá trị mặc định
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
            audioRef.current.playbackRate = 1; // Âm thanh bổ sung không thay đổi tốc độ
        }
    }, [speed]);

    const handleImageChange = (e, index) => {
        if (index >= imagePropsArray.length) return; // Kiểm tra chỉ số hợp lệ

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
        setMessage(''); // Xóa thông báo cũ
        const formData = new FormData();
        formData.append('video', videoFile);
        imageFiles.forEach((file, index) => {
            formData.append(`image${index}`, file);
        });
        if (audioFile) formData.append('audio', audioFile);
        formData.append('params', JSON.stringify({
            startTime,
            endTime,
            speed,
            volume,
            imagePropsArray: imageFiles.length > 0 ? imagePropsArray.slice(0, imageFiles.length) : [],
            audioProps: audioFile ? audioProps : null,
        }));

        try {
            const response = await axiosInstance.post('/ffmpeg/process', formData, {
                responseType: 'blob',
            });

            const blob = response.data;
            const url = URL.createObjectURL(blob);
            setOutputUrl(url);

            // Tự động tải video xuống
            const a = document.createElement('a');
            a.href = url;
            a.download = 'output.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Hiển thị thông báo xử lý thành công
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
        audioFile && { type: 'audio', file: audioFile },
    ].filter(Boolean);

    const adjustedImages = imageFiles.map((_, index) => {
        if (index < imagePropsArray.length) {
            return adjustImagePosition(imagePropsArray[index], videoScaleData);
        }
        return null;
    });

    const shouldShowImage = (index) => {
        if (!isPlaying) return true;
        if (index >= imagePropsArray.length) return false;
        const { startTime, endTime } = imagePropsArray[index];
        if (currentTime >= startTime && currentTime <= endTime) {
            return true;
        }
        return false;
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
                                <span>Chọn file hình ảnh (tối đa 3 ảnh):</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    multiple
                                    disabled={imageFiles.length >= 3}
                                />
                            </label>
                            <label>
                                <span>Chọn file âm thanh:</span>
                                <input type="file" accept="audio/*" onChange={handleAudioUpload} />
                            </label>
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
                                        {item.file?.name || 'Unknown'} ({item.type})
                                        {item.type.startsWith('image') && (
                                            <button
                                                onClick={() => handleRemoveImage(index - (videoFile ? 1 : 0))}
                                                style={{ marginLeft: '10px', color: 'red' }}
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={handleCancelAllFiles}
                                style={{ marginTop: '10px', padding: '5px 10px', backgroundColor: '#ff4444', color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                                Hủy
                            </button>
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