import React, { useEffect, useRef, useState } from 'react';
import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";
import './RecordCanvas.scss';

const { FaceLandmarker, FilesetResolver } = vision;

const RecordCanvas = ({ onRecordingStart, onRecordingStop, selectedFilter, selectedBackground, selectedAudio }) => {
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
    const backgroundImageRef = useRef(null);
    const filterRef = useRef(selectedFilter);
    const backgroundRef = useRef(selectedBackground);
    const lastFaceDetectedTimeRef = useRef(null); // Thời gian cuối cùng phát hiện khuôn mặt
    const filterOpacityRef = useRef(1); // Độ trong suốt của filter
    const lastFrameTimeRef = useRef(0); // Theo dõi thời gian khung hình để tính FPS
    const newLandmarksRef = useRef(null); // Lưu landmarks mới tạm thời
    const transitionStartTimeRef = useRef(null); // Thời gian bắt đầu chuyển đổi landmarks

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
        if (!faceLandmarker) return; // Chờ FaceLandmarker khởi tạo xong

        let isMounted = true;

        const startVideo = async () => {
            try {
                // Kiểm tra quyền webcam trước
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

    // Cập nhật refs khi props thay đổi
    useEffect(() => {
        filterRef.current = selectedFilter;
        backgroundRef.current = selectedBackground;
        console.log('Updated refs:', { filter: filterRef.current, background: backgroundRef.current });
    }, [selectedFilter, selectedBackground]);

    // Quản lý audio
    useEffect(() => {
        console.log('Selected audio:', selectedAudio);
        if (selectedAudio !== 'none' && audioRef.current) {
            audioRef.current.src = `/assets/audio/${selectedAudio}.mp3`;
            console.log('Setting audio src:', audioRef.current.src);
            fetch(audioRef.current.src)
                .then(res => console.log('Audio fetch status:', res.status))
                .catch(err => console.error('Audio fetch error:', err));
            audioRef.current.play().catch(err => console.error('Error playing audio:', err));
        } else if (audioRef.current) {
            audioRef.current.pause();
        }
    }, [selectedAudio]);

    // Tải và lưu background image
    useEffect(() => {
        console.log('Background effect triggered with:', backgroundRef.current);
        if (backgroundRef.current === 'bg1' || backgroundRef.current === 'bg2') {
            const bgImage = new Image();
            bgImage.src = `/assets/backgrounds/${backgroundRef.current}.jpg`;
            console.log('Preloading background image:', bgImage.src);
            fetch(bgImage.src, { signal: AbortSignal.timeout(5000) })
                .then(res => console.log('Background fetch status:', res.status))
                .catch(err => console.error('Background fetch error:', err));
            bgImage.onload = () => {
                console.log('Background image preloaded successfully');
                backgroundImageRef.current = bgImage;
            };
            bgImage.onerror = () => {
                console.error('Error preloading background image:', bgImage.src);
                backgroundImageRef.current = null;
            };
        } else {
            backgroundImageRef.current = null;
            console.log('No background selected');
        }
    }, [selectedBackground]);

    // Làm mượt landmarks
    const smoothLandmarks = (currentLandmarks, previousLandmarks) => {
        if (!previousLandmarks) return currentLandmarks;
        const smoothingFactor = 0.1; // Giảm hệ số làm mượt để giữ nhiều giá trị cũ hơn
        return currentLandmarks.map((landmark, index) => ({
            x: landmark.x * smoothingFactor + previousLandmarks[index].x * (1 - smoothingFactor),
            y: landmark.y * smoothingFactor + previousLandmarks[index].y * (1 - smoothingFactor),
            z: landmark.z * smoothingFactor + previousLandmarks[index].z * (1 - smoothingFactor),
        }));
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

            // Tính FPS
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
                    // Lưu landmarks mới vào biến tạm thời
                    const smoothedLandmarks = lastLandmarksRef.current
                        ? smoothLandmarks(results.faceLandmarks[0], lastLandmarksRef.current)
                        : results.faceLandmarks[0];
                    newLandmarksRef.current = smoothedLandmarks;
                    lastFaceDetectedTimeRef.current = performance.now();
                    filterOpacityRef.current = 1;

                    // Nếu đang trong quá trình chuyển đổi, tiếp tục sử dụng landmarks cũ
                    if (!transitionStartTimeRef.current) {
                        transitionStartTimeRef.current = performance.now();
                    }
                } else {
                    console.warn('No faces detected');
                    // Kiểm tra thời gian kể từ lần cuối phát hiện khuôn mặt
                    const timeSinceLastFace = lastFaceDetectedTimeRef.current
                        ? (performance.now() - lastFaceDetectedTimeRef.current) / 1000
                        : Infinity;
                    // Nếu đã quá 5 giây kể từ lần cuối phát hiện khuôn mặt, bắt đầu mờ dần
                    if (timeSinceLastFace > 5) {
                        // Mờ dần trong 1 giây (từ 5s đến 6s)
                        const fadeDuration = 1;
                        const fadeStartTime = 5;
                        if (timeSinceLastFace > fadeStartTime + fadeDuration) {
                            lastLandmarksRef.current = null;
                            newLandmarksRef.current = null;
                            transitionStartTimeRef.current = null;
                            filterOpacityRef.current = 0;
                        } else {
                            const fadeProgress = (timeSinceLastFace - fadeStartTime) / fadeDuration;
                            filterOpacityRef.current = 1 - fadeProgress;
                        }
                    }
                }

                // Kiểm tra thời gian chuyển đổi giữa landmarks cũ và mới
                if (transitionStartTimeRef.current && newLandmarksRef.current) {
                    const timeSinceTransition = (performance.now() - transitionStartTimeRef.current) / 1000;
                    if (timeSinceTransition > 0.1) { // Chuyển đổi sau 100ms
                        lastLandmarksRef.current = newLandmarksRef.current;
                        newLandmarksRef.current = null;
                        transitionStartTimeRef.current = null;
                    }
                }
            } catch (err) {
                console.error('Face detection error:', err);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Vẽ background
            if (backgroundImageRef.current) {
                console.log('Drawing background image');
                ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
            }

            // Vẽ video webcam
            console.log('Drawing webcam video');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            // Vẽ filter dựa trên lần nhận diện gần nhất
            if (filterRef.current !== 'none' && lastLandmarksRef.current) {
                console.log('Attempting to draw filter:', filterRef.current);
                const landmarks = lastLandmarksRef.current;
                // MediaPipe FaceLandmarker landmarks: right eye (33), left eye (263), forehead (151)
                const rightEye = landmarks[33];
                const leftEye = landmarks[263];
                const forehead = landmarks[151];

                // Lưu trạng thái canvas và áp dụng độ trong suốt
                ctx.save();
                ctx.globalAlpha = filterOpacityRef.current;

                if (filterRef.current === 'glasses') {
                    const glasses = new Image();
                    glasses.src = '/assets/filters/glasses.png';
                    console.log('Loading glasses filter:', glasses.src);
                    fetch(glasses.src, { signal: AbortSignal.timeout(5000) })
                        .then(res => console.log('Glasses fetch status:', res.status))
                        .catch(err => console.error('Glasses fetch error:', err));
                    if (glasses.complete) {
                        console.log('Drawing glasses filter');
                        const eyeDistance = Math.abs(rightEye.x - leftEye.x) * canvas.width;
                        const glassesWidth = eyeDistance * 2.5;
                        // Tính tỷ lệ chiều cao dựa trên tỷ lệ gốc của ảnh
                        const aspectRatio = glasses.naturalWidth / glasses.naturalHeight;
                        const glassesHeight = glassesWidth / aspectRatio;
                        // Tính trung điểm giữa hai mắt
                        const midEyeX = (leftEye.x + rightEye.x) / 2 * canvas.width;
                        const midEyeY = (leftEye.y + rightEye.y) / 2 * canvas.height;
                        // Dịch kính xuống một chút để căn chỉnh trên mắt
                        const offsetY = glassesHeight * 0.1; // Dịch xuống 10% chiều cao kính
                        ctx.drawImage(
                            glasses,
                            midEyeX - (glassesWidth / 2), // Căn giữa theo trục x
                            midEyeY - (glassesHeight / 2) + offsetY, // Căn giữa theo trục y và dịch xuống
                            glassesWidth,
                            glassesHeight
                        );
                    } else {
                        glasses.onload = () => {
                            console.log('Glasses filter loaded');
                            const eyeDistance = Math.abs(rightEye.x - leftEye.x) * canvas.width;
                            const glassesWidth = eyeDistance * 2.5;
                            const aspectRatio = glasses.naturalWidth / glasses.naturalHeight;
                            const glassesHeight = glassesWidth / aspectRatio;
                            const midEyeX = (leftEye.x + rightEye.x) / 2 * canvas.width;
                            const midEyeY = (leftEye.y + rightEye.y) / 2 * canvas.height;
                            const offsetY = glassesHeight * 0.1;
                            ctx.drawImage(
                                glasses,
                                midEyeX - (glassesWidth / 2),
                                midEyeY - (glassesHeight / 2) + offsetY,
                                glassesWidth,
                                glassesHeight
                            );
                        };
                        glasses.onerror = () => console.error('Error loading glasses filter:', glasses.src);
                    }
                } else if (filterRef.current === 'hat') {
                    const hat = new Image();
                    hat.src = '/assets/filters/hat.png';
                    console.log('Loading hat filter:', hat.src);
                    fetch(hat.src, { signal: AbortSignal.timeout(5000) })
                        .then(res => console.log('Hat fetch status:', res.status))
                        .catch(err => console.error('Hat fetch error:', err));
                    if (hat.complete) {
                        console.log('Drawing hat filter');
                        const faceWidth = Math.abs(rightEye.x - leftEye.x) * canvas.width * 2;
                        const hatWidth = faceWidth * 1.2;
                        const hatHeight = hatWidth * 0.5;
                        ctx.drawImage(
                            hat,
                            (forehead.x * canvas.width) - (hatWidth * 0.5),
                            (forehead.y * canvas.height) - hatHeight,
                            hatWidth,
                            hatHeight
                        );
                    } else {
                        hat.onload = () => {
                            console.log('Hat filter loaded');
                            const faceWidth = Math.abs(rightEye.x - leftEye.x) * canvas.width * 2;
                            const hatWidth = faceWidth * 1.2;
                            const hatHeight = hatWidth * 0.5;
                            ctx.drawImage(
                                hat,
                                (forehead.x * canvas.width) - (hatWidth * 0.5),
                                (forehead.y * canvas.height) - hatHeight,
                                hatWidth,
                                hatHeight
                            );
                        };
                        hat.onerror = () => console.error('Error loading hat filter:', hat.src);
                    }
                }

                // Khôi phục trạng thái canvas
                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(renderFrame);
        };

        // Khởi tạo canvas
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

        if (selectedAudio !== 'none' && audioRef.current) {
            try {
                const audioSource = audioContext.createMediaElementSource(audioRef.current);
                audioSource.connect(destination);
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

    if (error) return <div className="error">Lỗi: {error}</div>;

    return (
        <div className="record-canvas">
            <video
                ref={videoRef}
                autoPlay
                muted
                style={{ width: '50%', border: '1px solid red' }} // Hiển thị video để kiểm tra
            />
            <canvas ref={canvasRef} style={{ border: '1px solid blue', width: '100%' }} />
            <audio ref={audioRef} loop style={{ display: 'none' }} />
            <div className="controls">
                <button onClick={startRecording} disabled={isRecording}>
                    Start Recording
                </button>
                <button onClick={stopRecording} disabled={!isRecording}>
                    Stop Recording
                </button>
            </div>
        </div>
    );
};

export default RecordCanvas;