import React, { useRef, useState, useEffect } from 'react';
import './ScreenRecorder.scss';

const ScreenRecorder = ({ onRecordingStart, onRecordingStop }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState(null);
    const [useWebcam, setUseWebcam] = useState(false);
    const [isPipActive, setIsPipActive] = useState(false);
    const [instruction, setInstruction] = useState('');
    const recorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const screenStreamRef = useRef(null);
    const webcamStreamRef = useRef(null);
    const micStreamRef = useRef(null); // Luồng mic
    const audioContextRef = useRef(null); // AudioContext để kết hợp âm thanh
    const screenVideoRef = useRef(null);
    const webcamVideoRef = useRef(null);
    const isMountedRef = useRef(true);

    // Kiểm tra quyền truy cập webcam và mic
    const checkPermission = async (deviceType) => {
        try {
            const permissionStatus = await navigator.permissions.query({ name: deviceType });
            console.log(`${deviceType} permission status:`, permissionStatus.state);
            return permissionStatus.state === 'granted';
        } catch (err) {
            console.error(`Lỗi khi kiểm tra quyền ${deviceType}:`, err);
            return false;
        }
    };

    // Đợi metadata của video webcam tải
    const waitForWebcamMetadata = async () => {
        if (!webcamVideoRef.current) {
            console.error('webcamVideoRef.current is null when waiting for metadata');
            return false;
        }
        if (webcamVideoRef.current.readyState >= 1) return true;
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.warn('Timeout waiting for webcam metadata');
                resolve(false);
            }, 5000);

            webcamVideoRef.current.onloadedmetadata = () => {
                console.log('Webcam metadata loaded');
                clearTimeout(timeout);
                resolve(true);
            };
            webcamVideoRef.current.onerror = () => {
                console.error('Error while loading webcam metadata');
                clearTimeout(timeout);
                resolve(false);
            };
        });
    };

    // Bật webcam và mic, mở PiP sau khi render
    useEffect(() => {
        console.log('useEffect for webcam, useWebcam:', useWebcam);
        if (!useWebcam) {
            // Tắt webcam và mic
            if (webcamStreamRef.current) {
                console.log('Tắt webcam...');
                webcamStreamRef.current.getTracks().forEach(track => track.stop());
                webcamStreamRef.current = null;
            }
            if (micStreamRef.current) {
                console.log('Tắt mic...');
                micStreamRef.current.getTracks().forEach(track => track.stop());
                micStreamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (document.pictureInPictureElement) {
                console.log('Thoát PiP...');
                document.exitPictureInPicture()
                    .then(() => {
                        console.log('PiP closed');
                        setIsPipActive(false);
                    })
                    .catch(err => {
                        console.error('Lỗi khi thoát PiP:', err);
                    });
            }
            if (webcamVideoRef.current) {
                webcamVideoRef.current.srcObject = null;
            }
            return;
        }

        // Bật webcam và mic
        const startWebcamAndMic = async () => {
            console.log('Bật webcam và mic...');
            const hasWebcamPermission = await checkPermission('camera');
            const hasMicPermission = await checkPermission('microphone');
            if (!hasWebcamPermission || !hasMicPermission) {
                setError('Quyền truy cập webcam hoặc mic không được cấp. Vui lòng kiểm tra cài đặt trình duyệt.');
                console.error('Quyền webcam hoặc mic không được cấp');
                return;
            }

            try {
                const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (!isMountedRef.current) {
                    console.log('Component unmounted, stopping webcam stream...');
                    webcamStream.getTracks().forEach(track => track.stop());
                    return;
                }
                console.log('Webcam stream obtained:', webcamStream);
                webcamStreamRef.current = webcamStream;

                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!isMountedRef.current) {
                    console.log('Component unmounted, stopping mic stream...');
                    micStream.getTracks().forEach(track => track.stop());
                    return;
                }
                console.log('Mic stream obtained:', micStream);
                micStreamRef.current = micStream;

                if (webcamVideoRef.current) {
                    console.log('Attaching stream to webcam video element');
                    webcamVideoRef.current.srcObject = webcamStream;

                    const metadataLoaded = await waitForWebcamMetadata();
                    if (!metadataLoaded) {
                        setError('Không thể tải metadata của video webcam.');
                        return;
                    }

                    if (!isMountedRef.current) {
                        console.log('Component unmounted, stopping webcam stream...');
                        webcamStream.getTracks().forEach(track => track.stop());
                        return;
                    }

                    console.log('Phát video webcam...');
                    await webcamVideoRef.current.play();

                    try {
                        console.log('Kiểm tra trạng thái PiP hiện tại...');
                        if (document.pictureInPictureElement) {
                            console.log('A PiP window is already open, closing it...');
                            await document.exitPictureInPicture();
                            setIsPipActive(false);
                        }

                        console.log('Thử mở PiP...');
                        await webcamVideoRef.current.requestPictureInPicture();
                        setIsPipActive(true);
                        console.log('PiP opened successfully');
                    } catch (err) {
                        console.error('Lỗi khi kích hoạt PiP:', err);
                        setError('Không thể kích hoạt chế độ Picture-in-Picture: ' + err.message);
                    }
                } else {
                    console.error('webcamVideoRef.current is null');
                    setError('Không thể truy cập thẻ video webcam');
                }
            } catch (err) {
                console.error('Lỗi khi truy cập webcam hoặc mic:', err);
                setError('Không thể truy cập webcam hoặc mic: ' + err.message);
            }
        };

        startWebcamAndMic();
    }, [useWebcam]);

    // Bật hoặc tắt webcam (chỉ cập nhật trạng thái useWebcam)
    const toggleWebcam = () => {
        console.log('toggleWebcam called, useWebcam:', useWebcam);
        setUseWebcam(prev => !prev);
    };

    // Quản lý mount/unmount để tránh lỗi không đồng bộ
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            console.log('Component unmounted');
            isMountedRef.current = false;
            if (webcamStreamRef.current) {
                webcamStreamRef.current.getTracks().forEach(track => track.stop());
                webcamStreamRef.current = null;
            }
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach(track => track.stop());
                micStreamRef.current = null;
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);

    const startScreenRecording = async () => {
        try {
            console.log('Bắt đầu ghi màn hình...');
            setInstruction('Vui lòng chọn "Toàn màn hình" để ghi hình bao gồm cửa sổ webcam.');
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: 'monitor' },
                audio: true,
            });
            screenStreamRef.current = screenStream;

            if (screenVideoRef.current) {
                console.log('Attaching screen stream to video element');
                screenVideoRef.current.srcObject = screenStream;
                await new Promise(resolve => {
                    screenVideoRef.current.onloadedmetadata = () => {
                        console.log('Metadata video màn hình đã tải:', {
                            width: screenVideoRef.current.videoWidth,
                            height: screenVideoRef.current.videoHeight,
                        });
                        resolve();
                    };
                });
                screenVideoRef.current.play().catch(err => {
                    console.error('Lỗi phát video màn hình:', err);
                    setError('Không thể phát video màn hình: ' + err.message);
                });
                screenVideoRef.current.addEventListener('playing', () => {
                    console.log('Video màn hình đang phát');
                });
            }

            recordedChunksRef.current = [];
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            const destination = audioContext.createMediaStreamDestination();

            // Kết hợp âm thanh hệ thống và mic bằng AudioContext
            if (screenStreamRef.current) {
                const screenAudioSource = audioContext.createMediaStreamSource(screenStreamRef.current);
                screenAudioSource.connect(destination);
                console.log('Connected screen audio to AudioContext');
            }

            if (micStreamRef.current) {
                const micAudioSource = audioContext.createMediaStreamSource(micStreamRef.current);
                micAudioSource.connect(destination);
                console.log('Connected mic audio to AudioContext');
            }

            const combinedStream = new MediaStream([
                ...screenStreamRef.current.getVideoTracks(),
                destination.stream.getAudioTracks()[0], // Chỉ lấy track audio từ destination
            ]);
            console.log('Combined stream tracks:', {
                videoTracks: combinedStream.getVideoTracks().length,
                audioTracks: combinedStream.getAudioTracks().length,
            });

            recorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp9' });
            recorderRef.current.ondataavailable = (e) => {
                console.log('Dữ liệu ghi hình:', e.data.size, 'bytes');
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };
            recorderRef.current.onstop = () => {
                console.log('Số chunk ghi được:', recordedChunksRef.current.length);
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                console.log('Kích thước video:', blob.size, 'bytes');
                if (blob.size === 0) {
                    setError('Video ghi được không có dữ liệu. Vui lòng ghi hình ít nhất vài giây.');
                    return;
                }
                const url = URL.createObjectURL(blob);
                onRecordingStop(url);
                setIsRecording(false);

                const link = document.createElement('a');
                link.href = url;
                link.download = `ghi-man-hinh-${new Date().toISOString()}.webm`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('Video màn hình tải xuống tự động');

                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach(track => track.stop());
                }
                if (webcamStreamRef.current) {
                    webcamStreamRef.current.getTracks().forEach(track => track.stop());
                    webcamStreamRef.current = null;
                    if (webcamVideoRef.current) {
                        webcamVideoRef.current.srcObject = null;
                    }
                    setUseWebcam(false);
                    setIsPipActive(false);
                }
                if (micStreamRef.current) {
                    micStreamRef.current.getTracks().forEach(track => track.stop());
                    micStreamRef.current = null;
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
            };
            recorderRef.current.start();
            setIsRecording(true);
            onRecordingStart();
        } catch (err) {
            console.error('Lỗi khi ghi màn hình:', err);
            setError('Không thể ghi màn hình: ' + err.message);
        }
    };

    const stopScreenRecording = () => {
        if (recorderRef.current && isRecording) {
            console.log('Dừng ghi màn hình...');
            recorderRef.current.stop();
        }
    };

    // Xử lý sự kiện khi thoát PiP
    useEffect(() => {
        const handlePipExit = () => {
            console.log('PiP exited by user');
            setIsPipActive(false);
        };
        document.addEventListener('leavepictureinpicture', handlePipExit);
        return () => {
            document.removeEventListener('leavepictureinpicture', handlePipExit);
        };
    }, []);

    if (error) return <div className="error">Lỗi: {error}</div>;

    return (
        <div className="screen-recorder">
            <div className="video-container">
                <video
                    ref={screenVideoRef}
                    autoPlay
                    muted
                    style={{ width: '100%', border: '1px solid red', borderRadius: '8px' }}
                />
                {/* Luôn render thẻ video, điều khiển hiển thị bằng CSS */}
                <video
                    ref={webcamVideoRef}
                    autoPlay
                    muted
                    style={{
                        display: useWebcam && !isPipActive ? 'block' : 'none',
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        width: '200px',
                        height: '150px',
                        border: '1px solid green',
                        borderRadius: '4px',
                        zIndex: 10,
                    }}
                />
            </div>
            <div className="controls">
                <div className="webcam-toggle">
                    <label>
                        <input
                            type="checkbox"
                            checked={useWebcam}
                            onChange={toggleWebcam}
                            disabled={isRecording}
                        />
                        Hiển thị webcam (Picture-in-Picture)
                    </label>
                </div>
                <div className="button-group">
                    <button onClick={startScreenRecording} disabled={isRecording}>
                        Bắt đầu ghi màn hình
                    </button>
                    <button onClick={stopScreenRecording} disabled={!isRecording}>
                        Dừng ghi màn hình
                    </button>
                </div>
            </div>
            {(instruction || useWebcam) && (
                <div className="pip-instruction">
                    {instruction && <p>{instruction}</p>}
                    {useWebcam && (
                        <p>Lưu ý: Webcam sẽ hiển thị trong cửa sổ Picture-in-Picture. Bạn có thể di chuyển và thay đổi kích thước cửa sổ này. Khi ghi hình, hãy chọn "Toàn màn hình" để bao gồm webcam.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ScreenRecorder;