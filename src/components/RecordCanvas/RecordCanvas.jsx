import React, { useEffect, useRef, useState } from 'react';
import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";
import './RecordCanvas.scss';

// Giải nén FilesetResolver và FaceLandmarker từ vision
const { FaceLandmarker, FilesetResolver } = vision;

// Thêm các lớp LowPassFilter và OneEuroFilter
class LowPassFilter {
    constructor(alpha) {
        this.y = null;
        this.s = null;
        this.setAlpha(alpha);
    }

    setAlpha(alpha) {
        if (alpha <= 0 || alpha > 1.0) {
            throw new Error('alpha should be in (0.0, 1.0]');
        }
        this.alpha = alpha;
    }

    filter(value) {
        if (this.y === null) {
            this.y = value;
            this.s = value;
        } else {
            this.y = this.alpha * value + (1.0 - this.alpha) * this.s;
            this.s = this.y;
        }
        return this.y;
    }
}

class OneEuroFilter {
    constructor(freq, mincutoff = 0.3, beta = 0.2, dcutoff = 1.0) {
        this.freq = freq;
        this.mincutoff = mincutoff;
        this.beta = beta;
        this.dcutoff = dcutoff;
        this.x = new LowPassFilter(this.getAlpha(this.mincutoff));
        this.dx = new LowPassFilter(this.getAlpha(this.dcutoff));
        this.lasttime = null;
    }

    getAlpha(cutoff) {
        const safeCutoff = Math.max(0.1, Math.min(cutoff, 10));
        const te = 1.0 / this.freq;
        const tau = 1.0 / (2 * Math.PI * safeCutoff);
        let alpha = 1.0 / (1.0 + tau / te);
        alpha = Math.max(0.0001, Math.min(alpha, 1.0));
        return alpha;
    }

    filter(value, timestamp = null) {
        if (this.lasttime !== null && timestamp !== null) {
            const deltaTime = timestamp - this.lasttime;
            if (deltaTime > 0) {
                this.freq = Math.min(120, Math.max(1.0 / deltaTime, 1));
            } else {
                this.freq = 30;
            }
        } else {
            this.freq = 30;
        }
        this.lasttime = timestamp;

        const prev_x = this.x.y;
        const x_filter = this.x.filter(value);

        const dx = prev_x !== null ? (x_filter - prev_x) * this.freq : 0.0;
        const dx_filter = this.dx.filter(dx);

        const cutoff = this.mincutoff + this.beta * Math.abs(dx_filter);
        this.x.setAlpha(this.getAlpha(cutoff));

        return x_filter;
    }
}

const RecordCanvas = ({ onRecordingStart, onRecordingStop }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const audioRef = useRef(null);
    const [error, setError] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [faceLandmarker, setFaceLandmarker] = useState(null);
    const recorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const streamRef = useRef(null);
    const lastLandmarksRef = useRef(null);
    const filterRef = useRef('none');
    const lastFaceDetectedTimeRef = useRef(null);
    const filterOpacityRef = useRef(1);
    const lastFrameTimeRef = useRef(0);
    const glassesImageRef = useRef(null);
    const hatImageRef = useRef(null);
    const landmarkFiltersRef = useRef(null);
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [selectedAudioFile, setSelectedAudioFile] = useState(null);

    // Tải trước filter kính và mũ
    useEffect(() => {
        const glasses = new Image();
        glasses.src = '/assets/filters/glasses.png';
        glasses.onload = () => {
            console.log('Glasses filter preloaded');
            glassesImageRef.current = glasses;
        };
        glasses.onerror = () => {
            console.error('Error preloading glasses filter:', glasses.src);
        };

        const hat = new Image();
        hat.src = '/assets/filters/hat.png';
        hat.onload = () => {
            console.log('Hat filter preloaded');
            hatImageRef.current = hat;
        };
        hat.onerror = () => {
            console.error('Error preloading hat filter:', hat.src);
        };
    }, []);

    // Kiểm tra quyền webcam
    const checkCameraPermission = async () => {
        try {
            const permissionStatus = await navigator.permissions.query({ name: 'camera' });
            console.log('Camera permission status:', permissionStatus.state);
            return permissionStatus.state === 'granted';
        } catch (err) {
            console.error('Error checking camera permission:', err);
            return false;
        }
    };

    // Khởi tạo FaceLandmarker
    useEffect(() => {
        const createFaceLandmarker = async () => {
            try {
                console.log('Creating FaceLandmarker...');
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
                );
                const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numFaces: 1
                });
                console.log('FaceLandmarker created successfully');
                setFaceLandmarker(landmarker);
            } catch (err) {
                console.error('Error creating FaceLandmarker:', err);
                setError('Không thể khởi tạo MediaPipe FaceLandmarker: ' + err.message);
            }
        };

        createFaceLandmarker();
    }, []);

    // Khởi động webcam
    useEffect(() => {
        if (!faceLandmarker) return;

        let isMounted = true;

        const startVideo = async () => {
            try {
                const hasPermission = await checkCameraPermission();
                if (!hasPermission) {
                    throw new Error('Quyền truy cập webcam không được cấp. Vui lòng kiểm tra cài đặt trình duyệt.');
                }

                console.log('Starting webcam...');
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                console.log('Webcam stream obtained:', stream);
                if (isMounted) {
                    streamRef.current = stream;
                    if (videoRef.current) {
                        console.log('Attaching stream to video element');
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                            console.log('Video metadata loaded:', {
                                width: videoRef.current.videoWidth,
                                height: videoRef.current.videoHeight,
                            });
                            videoRef.current.play().catch(err => {
                                console.error('Error playing video:', err);
                                setError('Không thể phát video webcam: ' + err.message);
                            });
                        };
                        videoRef.current.onerror = (err) => {
                            console.error('Video element error:', err);
                            setError('Lỗi thẻ video: ' + err.message);
                        };
                    } else {
                        console.warn('videoRef.current is null');
                        setError('Không thể truy cập thẻ video');
                    }
                }
            } catch (err) {
                console.error('Error accessing webcam:', err);
                setError('Không thể truy cập webcam: ' + err.message);
            }
        };

        startVideo();

        return () => {
            isMounted = false;
            if (streamRef.current) {
                console.log('Stopping webcam stream...');
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [faceLandmarker]);

    // Cập nhật refs khi trạng thái thay đổi
    useEffect(() => {
        filterRef.current = selectedFilter;
        console.log('Updated refs:', { filter: filterRef.current });
    }, [selectedFilter]);

    // Làm mượt landmarks
    const smoothLandmarks = (currentLandmarks, previousLandmarks) => {
        if (!previousLandmarks || currentLandmarks.length !== previousLandmarks.length) {
            return currentLandmarks;
        }
        const smoothingFactor = 0.05;
        return currentLandmarks.map((landmark, index) => {
            const prevLandmark = previousLandmarks[index];
            if (!prevLandmark || !landmark) return landmark;
            return {
                x: landmark.x * smoothingFactor + prevLandmark.x * (1 - smoothingFactor),
                y: landmark.y * smoothingFactor + prevLandmark.y * (1 - smoothingFactor),
                z: landmark.z * smoothingFactor + prevLandmark.z * (1 - smoothingFactor),
            };
        });
    };

    // Áp dụng bộ lọc One-Euro cho toàn bộ landmarks
    const filterLandmarks = (landmarks, timestamp) => {
        if (!landmarks || landmarks.length !== 468) {
            console.warn('Invalid number of landmarks:', landmarks ? landmarks.length : 'undefined');
            return landmarks;
        }

        if (!landmarkFiltersRef.current) {
            landmarkFiltersRef.current = Array.from({ length: 468 }, () => ({
                x: new OneEuroFilter(30, 0.3, 0.2, 1.0),
                y: new OneEuroFilter(30, 0.3, 0.2, 1.0),
                z: new OneEuroFilter(30, 0.3, 0.2, 1.0),
            }));
        }

        return landmarks.map((landmark, index) => {
            if (!landmark || typeof landmark.x === 'undefined' || typeof landmark.y === 'undefined' || typeof landmark.z === 'undefined') {
                console.warn('Invalid landmark at index:', index, landmark);
                return landmark;
            }
            return {
                x: landmarkFiltersRef.current[index].x.filter(landmark.x, timestamp / 1000),
                y: landmarkFiltersRef.current[index].y.filter(landmark.y, timestamp / 1000),
                z: landmarkFiltersRef.current[index].z.filter(landmark.z, timestamp / 1000),
            };
        });
    };

    // Vẽ frame lên canvas
    useEffect(() => {
        console.log('Render effect triggered, refs:', {
            video: !!videoRef.current,
            canvas: !!canvasRef.current,
            faceLandmarker: !!faceLandmarker,
        });
        if (!videoRef.current || !canvasRef.current || !faceLandmarker) {
            console.log('Skipping render: video, canvas, or FaceLandmarker not ready');
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let animationFrameId;
        const renderFrame = async () => {
            if (!videoRef.current || !canvasRef.current || !faceLandmarker) {
                console.log('Skipping render: video, canvas, or FaceLandmarker not ready');
                animationFrameId = requestAnimationFrame(renderFrame);
                return;
            }

            const now = performance.now();
            if (lastFrameTimeRef.current) {
                const deltaTime = now - lastFrameTimeRef.current;
                console.log('FPS:', 1000 / deltaTime);
            }
            lastFrameTimeRef.current = now;

            console.log('Rendering frame, readyState:', videoRef.current.readyState);
            if (videoRef.current.readyState < 2) {
                console.log('Skipping render: video not ready');
                animationFrameId = requestAnimationFrame(renderFrame);
                return;
            }

            // Nhận diện khuôn mặt
            try {
                const results = await faceLandmarker.detectForVideo(videoRef.current, performance.now());
                console.log('FaceLandmarker results:', results.faceLandmarks.length);
                if (results.faceLandmarks.length > 0) {
                    const smoothedLandmarks = lastLandmarksRef.current
                        ? smoothLandmarks(results.faceLandmarks[0], lastLandmarksRef.current)
                        : results.faceLandmarks[0];
                    const filteredLandmarks = filterLandmarks(smoothedLandmarks, now);
                    lastLandmarksRef.current = filteredLandmarks;
                    lastFaceDetectedTimeRef.current = performance.now();
                    filterOpacityRef.current = 1;
                } else {
                    console.warn('No faces detected');
                    const timeSinceLastFace = lastFaceDetectedTimeRef.current
                        ? (performance.now() - lastFaceDetectedTimeRef.current) / 1000
                        : Infinity;
                    if (timeSinceLastFace > 5) {
                        const fadeDuration = 1;
                        const fadeStartTime = 5;
                        if (timeSinceLastFace > fadeStartTime + fadeDuration) {
                            lastLandmarksRef.current = null;
                            filterOpacityRef.current = 0;
                        } else {
                            const fadeProgress = (timeSinceLastFace - fadeStartTime) / fadeDuration;
                            filterOpacityRef.current = 1 - fadeProgress;
                        }
                    }
                }
            } catch (err) {
                console.error('Face detection error:', err);
            }

            try {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Vẽ video webcam
                console.log('Drawing webcam video');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                // Vẽ filter dựa trên lần nhận diện gần nhất
                if (filterRef.current !== 'none' && lastLandmarksRef.current) {
                    console.log('Attempting to draw filter:', filterRef.current);
                    const landmarks = lastLandmarksRef.current;
                    const rightEye = landmarks[33];
                    const leftEye = landmarks[263];
                    const forehead = landmarks[151];

                    if (!rightEye || !leftEye || !forehead) {
                        console.warn('Missing required landmarks for drawing filter');
                        animationFrameId = requestAnimationFrame(renderFrame);
                        return;
                    }

                    ctx.save();
                    ctx.globalAlpha = filterOpacityRef.current;

                    if (filterRef.current === 'glasses' && glassesImageRef.current) {
                        console.log('Drawing glasses filter');
                        const eyeDistance = Math.abs(rightEye.x - leftEye.x) * canvas.width;
                        const glassesWidth = eyeDistance * 2;
                        const aspectRatio = glassesImageRef.current.naturalWidth / glassesImageRef.current.naturalHeight;
                        const glassesHeight = glassesWidth / aspectRatio;
                        const midEyeX = (leftEye.x + rightEye.x) / 2 * canvas.width;
                        const midEyeY = (leftEye.y + rightEye.y) / 2 * canvas.height;
                        const offsetY = glassesHeight * 0.06;
                        ctx.drawImage(
                            glassesImageRef.current,
                            midEyeX - (glassesWidth / 2),
                            midEyeY - (glassesHeight / 2) + offsetY,
                            glassesWidth,
                            glassesHeight
                        );
                    } else if (filterRef.current === 'hat' && hatImageRef.current) {
                        console.log('Drawing hat filter');
                        const faceWidth = Math.abs(rightEye.x - leftEye.x) * canvas.width * 2;
                        const hatWidth = faceWidth * 1.2;
                        const hatHeight = hatWidth * 1;
                        const offsetY = hatHeight * 0.08;
                        ctx.drawImage(
                            hatImageRef.current,
                            (forehead.x * canvas.width) - (hatWidth * 0.5),
                            (forehead.y * canvas.height) - (hatHeight * 0.8) + offsetY,
                            hatWidth,
                            hatHeight
                        );
                    }

                    ctx.restore();
                }
            } catch (err) {
                console.error('Error drawing on canvas:', err);
            }

            animationFrameId = requestAnimationFrame(renderFrame);
        };

        const initializeCanvas = () => {
            if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
                console.log('Initializing canvas with video dimensions:', {
                    width: videoRef.current.videoWidth,
                    height: videoRef.current.videoHeight,
                });
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
            } else {
                console.warn('Cannot initialize canvas: video dimensions not available');
            }
        };

        if (videoRef.current) {
            videoRef.current.addEventListener('loadedmetadata', () => {
                console.log('Video metadata loaded');
                initializeCanvas();
                renderFrame();
            });
            if (videoRef.current.videoWidth > 0) {
                console.log('Manually triggering canvas initialization');
                initializeCanvas();
                renderFrame();
            }
        } else {
            console.warn('videoRef.current is null when adding loadedmetadata listener');
        }

        return () => {
            if (videoRef.current) {
                videoRef.current.removeEventListener('loadedmetadata', initializeCanvas);
            }
            cancelAnimationFrame(animationFrameId);
            console.log('Cleaning up render effect');
        };
    }, [faceLandmarker]);

    // Ghi hình
    const startRecording = () => {
        if (!canvasRef.current || !streamRef.current || isRecording) return;

        recordedChunksRef.current = [];
        const canvasStream = canvasRef.current.captureStream(30);
        console.log('Canvas stream tracks:', canvasStream.getVideoTracks());
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();

        try {
            const micSource = audioContext.createMediaStreamSource(streamRef.current);
            micSource.connect(destination);
        } catch (err) {
            console.error('Error creating mic source:', err);
        }

        if (selectedAudioFile && audioRef.current) {
            try {
                audioRef.current.src = URL.createObjectURL(selectedAudioFile);
                console.log('Setting audio src:', audioRef.current.src);
                const audioSource = audioContext.createMediaElementSource(audioRef.current);
                audioSource.connect(destination);
                audioRef.current.play().catch(err => console.error('Error playing audio:', err));
            } catch (err) {
                console.error('Error creating audio source:', err);
            }
        }

        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...destination.stream.getAudioTracks(),
        ]);

        recorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
        recorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorderRef.current.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            onRecordingStop(url);
            setIsRecording(false);
            audioContext.close();

            const link = document.createElement('a');
            link.href = url;
            link.download = `ghi-hinh-${new Date().toISOString()}.webm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('Video downloaded automatically');
        };
        recorderRef.current.start();
        setIsRecording(true);
        onRecordingStart();
    };

    const stopRecording = () => {
        if (recorderRef.current && isRecording) {
            recorderRef.current.stop();
            if (audioRef.current) {
                audioRef.current.pause();
            }
        }
    };

    // Xử lý khi người dùng chọn file âm thanh từ máy tính
    const handleAudioFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedAudioFile(file);
            console.log('Đã chọn file âm thanh:', file.name);
        } else {
            setSelectedAudioFile(null);
            console.log('Không có file âm thanh nào được chọn');
        }
    };

    // Xử lý thay đổi filter
    const handleFilterChange = (e) => {
        console.log('Bộ lọc đã thay đổi thành:', e.target.value);
        setSelectedFilter(e.target.value);
    };

    if (error) return <div className="error">Lỗi: {error}</div>;

    return (
        <div className="record-canvas">
            <video
                ref={videoRef}
                autoPlay
                muted
                style={{ width: '50%', border: '1px solid red' }}
            />
            <canvas ref={canvasRef} style={{ border: '1px solid blue', width: '100%' }} />
            <audio ref={audioRef} loop style={{ display: 'none' }} />
            <div className="controls">
                <div className="filter-group">
                    <select value={selectedFilter} onChange={handleFilterChange} disabled={isRecording}>
                        <option value="none">Không có bộ lọc</option>
                        <option value="glasses">Kính</option>
                        <option value="hat">Mũ</option>
                    </select>
                </div>
                <div className="audio-group">
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileChange}
                        disabled={isRecording}
                    />
                    {selectedAudioFile && <span>Đã chọn: {selectedAudioFile.name}</span>}
                </div>
                <div className="button-group">
                    <button onClick={startRecording} disabled={isRecording}>
                        Bắt đầu ghi hình
                    </button>
                    <button onClick={stopRecording} disabled={!isRecording}>
                        Dừng ghi hình
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordCanvas;