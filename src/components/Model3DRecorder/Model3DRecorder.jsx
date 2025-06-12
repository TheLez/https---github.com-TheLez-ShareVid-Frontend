import React, { useEffect, useRef, useState } from 'react';
import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import './Model3DRecorder.scss';

// Giải nén từ vision
const { FaceLandmarker, FilesetResolver } = vision;

// Định nghĩa các chỉ số landmark cho mắt và miệng
const eyeKeyIndices = [
    [
        // Mắt trái
        33, 7, 163, 144, 145, 153, 154, 155, 133, // Viền dưới
        246, 161, 160, 159, 158, 157, 173         // Viền trên
    ],
    [
        // Mắt phải
        263, 249, 390, 373, 374, 380, 381, 382, 362, // Viền dưới
        466, 388, 387, 386, 385, 384, 398           // Viền trên
    ]
];

const mouthIndices = [78, 81, 13, 311, 308, 402, 14, 178];

// Hàm tính khoảng cách Euclidean giữa hai điểm
const distance = (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

// Tính Eye Aspect Ratio (EAR)
const eyeAspectRatio = (landmarks, side) => {
    const eyeKey = eyeKeyIndices[side === 'LEFT' ? 0 : 1];
    const p2 = {
        x: (landmarks[eyeKey[10]].x + landmarks[eyeKey[11]].x) / 2,
        y: (landmarks[eyeKey[10]].y + landmarks[eyeKey[11]].y) / 2
    };
    const p3 = {
        x: (landmarks[eyeKey[13]].x + landmarks[eyeKey[14]].x) / 2,
        y: (landmarks[eyeKey[13]].y + landmarks[eyeKey[14]].y) / 2
    };
    const p6 = {
        x: (landmarks[eyeKey[2]].x + landmarks[eyeKey[3]].x) / 2,
        y: (landmarks[eyeKey[2]].y + landmarks[eyeKey[3]].y) / 2
    };
    const p5 = {
        x: (landmarks[eyeKey[5]].x + landmarks[eyeKey[6]].x) / 2,
        y: (landmarks[eyeKey[5]].y + landmarks[eyeKey[6]].y) / 2
    };
    const p1 = landmarks[eyeKey[0]];
    const p4 = landmarks[eyeKey[8]];
    const tipOfEyebrow = side === 'LEFT' ? landmarks[105] : landmarks[334];

    let ear = (distance(p2, p6) + distance(p3, p5)) / (2 * distance(p1, p4) + 1e-6);
    ear *= (distance(tipOfEyebrow, landmarks[2]) / distance(landmarks[6], landmarks[2]));
    return ear;
};

// Tính Mouth Aspect Ratio (MAR)
const mouthAspectRatio = (landmarks) => {
    const p1 = landmarks[mouthIndices[0]];  // 78
    const p2 = landmarks[mouthIndices[1]];  // 81
    const p3 = landmarks[mouthIndices[2]];  // 13
    const p4 = landmarks[mouthIndices[3]];  // 311
    const p5 = landmarks[mouthIndices[4]];  // 308
    const p6 = landmarks[mouthIndices[5]];  // 402
    const p7 = landmarks[mouthIndices[6]];  // 14
    const p8 = landmarks[mouthIndices[7]];  // 178

    const mar = (distance(p2, p8) + distance(p3, p7) + distance(p4, p6)) / (2 * distance(p1, p5) + 1e-6);
    return mar;
};

const Model3DRecorder = ({ onRecordingStart, onRecordingStop }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const vrmRef = useRef(null);
    const recorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const faceLandmarkerRef = useRef(null); // Sử dụng FaceLandmarker
    const streamRef = useRef(null);
    const clockRef = useRef(new THREE.Clock());
    const [vrmLoaded, setVrmLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // State để điều chỉnh vị trí X, Y, Z và rotation Y của mô hình
    const [modelX, setModelX] = useState(0);
    const [modelY, setModelY] = useState(-1.5);
    const [modelZ, setModelZ] = useState(0);
    const [rotationY, setRotationY] = useState(0);

    // State để lưu trữ hình ảnh nền
    const [backgroundImage, setBackgroundImage] = useState(null);

    // Mảng để lưu trữ các giá trị EAR và MAR trước đó cho smoothing
    const earHistory = useRef({ left: [], right: [] });
    const marHistory = useRef([]);

    useEffect(() => {
        // Log để kiểm tra import
        console.log('FilesetResolver:', FilesetResolver);
        console.log('FaceLandmarker:', FaceLandmarker);

        // Khởi tạo Three.js
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 1; // Camera Z mặc định là 1, cố định
        cameraRef.current = camera;
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        renderer.setSize(window.innerWidth, window.innerHeight);
        rendererRef.current = renderer;

        // Thêm ánh sáng
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(1, 1, 1);
        scene.add(light);

        // Khởi tạo FaceLandmarker
        const initFaceLandmarker = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
                );
                console.log('FilesetResolver khởi tạo thành công');
                const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numFaces: 1
                });
                faceLandmarkerRef.current = faceLandmarker;
                setIsMediaPipeReady(true);
                console.log('FaceLandmarker khởi tạo thành công');
            } catch (err) {
                setError('Lỗi khi khởi tạo FaceLandmarker: ' + err.message);
                console.error('Lỗi khởi tạo FaceLandmarker:', err);
            }
        };
        initFaceLandmarker();

        // Khởi động webcam và microphone
        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                streamRef.current = stream;
                console.log('Webcam và microphone khởi động thành công');
            } catch (err) {
                setError('Lỗi khi truy cập webcam hoặc microphone: ' + err.message);
                console.error('Lỗi webcam/microphone:', err);
            }
        };
        startWebcam();

        // Vòng lặp render
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clockRef.current.getDelta();
            if (vrmRef.current) {
                vrmRef.current.update(delta); // Cập nhật mô hình VRM
            }
            renderer.render(sceneRef.current, cameraRef.current);
        };
        animate();

        // Dọn dẹp
        return () => {
            if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            renderer.dispose();
            if (recorderRef.current) recorderRef.current.stop();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Cập nhật vị trí và xoay của mô hình khi state thay đổi
    useEffect(() => {
        if (vrmRef.current) {
            vrmRef.current.scene.position.set(modelX, modelY, modelZ);
            vrmRef.current.scene.rotation.y = rotationY;
        }
        if (sceneRef.current && backgroundImage) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(backgroundImage, (texture) => {
                sceneRef.current.background = texture;
                console.log('Áp dụng background thành công');
            }, undefined, (err) => {
                console.error('Lỗi khi tải background:', err);
            });
        }
    }, [modelX, modelY, modelZ, rotationY, backgroundImage]);

    // Phát hiện khuôn mặt và điều khiển mô hình
    useEffect(() => {
        const detectFaces = async () => {
            if (!faceLandmarkerRef.current || !videoRef.current || !vrmRef.current) {
                console.warn('FaceLandmarker, video, hoặc VRM chưa sẵn sàng');
                return;
            }

            try {
                const results = await faceLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
                if (results.faceLandmarks && results.faceLandmarks[0]) {
                    const landmarks = results.faceLandmarks[0];

                    // Nháy mắt (đã hoạt động)
                    const leftEAR = eyeAspectRatio(landmarks, 'LEFT');
                    const rightEAR = eyeAspectRatio(landmarks, 'RIGHT');
                    const blinkThreshold = 0.3; // Ngưỡng nháy mắt
                    // Smoothing EAR
                    earHistory.current.left.push(leftEAR);
                    earHistory.current.right.push(rightEAR);
                    if (earHistory.current.left.length > 5) earHistory.current.left.shift();
                    if (earHistory.current.right.length > 5) earHistory.current.right.shift();
                    const avgLeftEAR = earHistory.current.left.reduce((a, b) => a + b, 0) / earHistory.current.left.length;
                    const avgRightEAR = earHistory.current.right.reduce((a, b) => a + b, 0) / earHistory.current.right.length;
                    console.log('Avg Left EAR:', avgLeftEAR.toFixed(3), 'Avg Right EAR:', avgRightEAR.toFixed(3));
                    vrmRef.current.expressionManager.setValue('blink', (avgLeftEAR < blinkThreshold || avgRightEAR < blinkThreshold) ? 1 : 0);

                    // Cử động miệng
                    const mar = mouthAspectRatio(landmarks);
                    // Smoothing MAR
                    marHistory.current.push(mar);
                    if (marHistory.current.length > 5) marHistory.current.shift();
                    const avgMAR = marHistory.current.reduce((a, b) => a + b, 0) / marHistory.current.length;
                    const minMAR = 0.03; // Điều chỉnh dựa trên Raw MAR nhỏ nhất (0.038)
                    const maxMAR = 1.7;  // Điều chỉnh dựa trên Raw MAR lớn nhất (1.685)
                    const mouthOpenness = Math.min(Math.max((avgMAR - minMAR) / (maxMAR - minMAR), 0), 1);
                    console.log('Raw MAR:', mar.toFixed(3), 'Avg MAR:', avgMAR.toFixed(3), 'Mouth openness:', mouthOpenness.toFixed(3));
                    const MOUTH_BLENDSHAPE = 'aa'; // Thử 'a', 'A', 'mouthOpen', 'jawOpen' dựa trên log
                    if (vrmRef.current.expressionManager) {
                        vrmRef.current.expressionManager.setValue(MOUTH_BLENDSHAPE, mouthOpenness);
                        console.log(`Set blendshape ${MOUTH_BLENDSHAPE} to ${mouthOpenness.toFixed(3)}`);
                    } else {
                        console.warn('expressionManager không khả dụng');
                    }

                    // Xoay đầu
                    const leftSide = landmarks[127]; // Điểm bên trái khuôn mặt
                    const rightSide = landmarks[356]; // Điểm bên phải khuôn mặt
                    const nose = landmarks[1]; // Điểm mũi
                    if (leftSide && rightSide && nose) {
                        const dx = rightSide.x - leftSide.x;
                        const dy = rightSide.y - leftSide.y;
                        const yaw = Math.atan2(dy, dx) * 4; // Độ nhạy yaw
                        const pitch = (nose.y - 0.5) * Math.PI * 1.5; // Độ nhạy pitch
                        const headBone = vrmRef.current.humanoid.getNormalizedBoneNode('head');
                        if (headBone) {
                            headBone.rotation.y = yaw;
                            headBone.rotation.x = pitch;
                        }
                    }
                } else {
                    console.warn('Không nhận diện được khuôn mặt');
                }
            } catch (err) {
                console.error('Lỗi phát hiện khuôn mặt:', err);
            }
            requestAnimationFrame(detectFaces);
        };

        if (isMediaPipeReady && vrmLoaded) {
            detectFaces();
        }
    }, [isMediaPipeReady, vrmLoaded]);

    // Xử lý khi người dùng chọn hình ảnh nền
    const handleBackgroundChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn một tệp hình ảnh');
            return;
        }

        const url = URL.createObjectURL(file);
        setBackgroundImage(url);
    };

    // Xử lý khi người dùng chọn tệp VRM
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.vrm')) {
            setError('Vui lòng chọn tệp định dạng .vrm');
            return;
        }

        setError(null);
        const url = URL.createObjectURL(file);
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(
            url,
            (gltf) => {
                const vrm = gltf.userData.vrm;
                if (vrm) {
                    // Kiểm tra phiên bản VRM
                    if (gltf.userData.vrmMeta && gltf.userData.vrmMeta.version === '0.0') {
                        console.warn('Tệp VRM sử dụng định dạng 0.0, nên nâng cấp lên VRM 1.0 để tương thích tốt hơn');
                    }
                    // Log danh sách bones để debug
                    console.log('VRM humanoid bones:', Object.keys(vrm.humanoid.humanBones));
                    if (vrmRef.current) {
                        sceneRef.current.remove(vrmRef.current.scene);
                    }

                    // Điều chỉnh tư thế tay
                    const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
                    const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
                    const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
                    const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');

                    if (leftUpperArm) {
                        leftUpperArm.rotation.z = -Math.PI / 2.2; // Hạ tay trái xuống
                        console.log('Adjusted leftUpperArm rotation.z:', leftUpperArm.rotation.z);
                    } else {
                        console.warn('Không tìm thấy bone leftUpperArm');
                    }
                    if (rightUpperArm) {
                        rightUpperArm.rotation.z = Math.PI / 2.2; // Hạ tay phải xuống
                        console.log('Adjusted rightUpperArm rotation.z:', rightUpperArm.rotation.z);
                    } else {
                        console.warn('Không tìm thấy bone rightUpperArm');
                    }
                    if (leftLowerArm) {
                        leftLowerArm.rotation.z = 0.2; // Tinh chỉnh khuỷu tay trái
                        console.log('Adjusted leftLowerArm rotation.z:', leftLowerArm.rotation.z);
                    }
                    if (rightLowerArm) {
                        rightLowerArm.rotation.z = -0.2; // Tinh chỉnh khuỷu tay phải
                        console.log('Adjusted rightLowerArm rotation.z:', rightLowerArm.rotation.z);
                    }

                    // Thử nhiều cách để log danh sách blendshape
                    if (vrm.expressionManager && vrm.expressionManager._expressionsMap) {
                        const expressionNames = Object.keys(vrm.expressionManager._expressionsMap);
                        console.log('Available expression names (expressionManager):', expressionNames);
                    } else if (vrm.blendShapeProxy) {
                        const blendShapeNames = Object.keys(vrm.blendShapeProxy._blendShapes);
                        console.log('Available blendshape names (blendShapeProxy):', blendShapeNames);
                    } else {
                        console.log('VRM object for debugging:', vrm);
                    }

                    // Điều chỉnh vị trí và xoay model
                    vrm.scene.position.set(modelX, modelY, modelZ);
                    vrm.scene.rotation.y = rotationY;
                    sceneRef.current.add(vrm.scene);
                    vrmRef.current = vrm;
                    setVrmLoaded(true);
                    URL.revokeObjectURL(url);
                    // Debug vị trí mô hình và camera
                    console.log('VRM position:', vrm.scene.position);
                    console.log('Camera position:', cameraRef.current.position);
                    console.log('Tải VRM thành công');
                } else {
                    setError('Không thể tải mô hình VRM');
                    console.error('Lỗi: Mô hình VRM không được tìm thấy trong gltf.userData');
                }
            },
            undefined,
            (err) => {
                setError('Lỗi khi tải tệp: ' + err.message);
                console.error('Lỗi tải tệp:', err);
            }
        );
    };

    // Bắt đầu ghi hình
    const handleStartRecording = () => {
        if (!vrmLoaded) {
            setError('Vui lòng tải mô hình VRM trước khi ghi hình');
            return;
        }
        if (!isMediaPipeReady) {
            setError('FaceLandmarker chưa sẵn sàng');
            return;
        }

        try {
            // Lấy luồng video từ canvas
            const canvasStream = canvasRef.current.captureStream(30);
            console.log('Canvas stream tracks:', canvasStream.getVideoTracks());

            // Tạo AudioContext để xử lý âm thanh
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const destination = audioContextRef.current.createMediaStreamDestination();

            // Kết nối âm thanh từ microphone
            if (streamRef.current) {
                const micSource = audioContextRef.current.createMediaStreamSource(streamRef.current);
                micSource.connect(destination);
                console.log('Microphone connected to destination');
            } else {
                console.warn('Không có luồng âm thanh từ microphone');
            }

            // Kết hợp luồng video và âm thanh
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...destination.stream.getAudioTracks(),
            ]);

            recorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
            const chunks = [];
            recorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            recorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'recording.webm';
                a.click();
                URL.revokeObjectURL(url);
                console.log('Video đã được tải xuống');
                setIsRecording(false);
                // Đóng AudioContext
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
            };
            recorderRef.current.start();
            setIsRecording(true);
            onRecordingStart();
            console.log('Bắt đầu ghi hình');
        } catch (err) {
            setError('Lỗi khi bắt đầu ghi hình: ' + err.message);
            console.error('Lỗi bắt đầu ghi hình:', err);
        }
    };

    // Dừng ghi hình
    const handleStopRecording = () => {
        if (recorderRef.current && isRecording) {
            try {
                recorderRef.current.stop();
                setIsRecording(false);
                onRecordingStop();
                console.log('Dừng ghi hình');
            } catch (err) {
                setError('Lỗi khi dừng ghi hình: ' + err.message);
                console.error('Lỗi dừng ghi hình:', err);
            }
        }
    };

    return (
        <div className="model3d-recorder">
            <video ref={videoRef} style={{ display: 'none' }} />
            <canvas ref={canvasRef} />
            <div className="controls">
                <div style={{ marginBottom: '10px' }}>
                    <label>Chọn file VRM: </label>
                    <input
                        type="file"
                        accept=".vrm"
                        onChange={handleFileChange}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Chọn file ảnh nền: </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundChange}
                    />
                </div>
                {error && <p className="error">{error}</p>}
                <button onClick={handleStartRecording} disabled={!vrmLoaded || !isMediaPipeReady || isRecording}>
                    Bắt đầu ghi
                </button>
                <button onClick={handleStopRecording} disabled={!vrmLoaded || !isMediaPipeReady || !isRecording}>
                    Dừng ghi
                </button>
                {/* Thanh trượt điều chỉnh model X position */}
                <div style={{ marginTop: '10px' }}>
                    <label>Model X Position: {modelX.toFixed(2)}</label>
                    <input
                        type="range"
                        min="-5"
                        max="5"
                        step="0.1"
                        value={modelX}
                        onChange={(e) => setModelX(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
                {/* Thanh trượt điều chỉnh position Y của mô hình */}
                <div style={{ marginTop: '10px' }}>
                    <label>Model Y Position: {modelY.toFixed(2)}</label>
                    <input
                        type="range"
                        min="-3"
                        max="0"
                        step="0.1"
                        value={modelY}
                        onChange={(e) => setModelY(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
                {/* Thanh trượt điều chỉnh model Z position */}
                <div style={{ marginTop: '10px' }}>
                    <label>Model Z Position: {modelZ.toFixed(2)}</label>
                    <input
                        type="range"
                        min="-5"
                        max="5"
                        step="0.1"
                        value={modelZ}
                        onChange={(e) => setModelZ(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
                {/* Thanh trượt điều chỉnh rotation Y của mô hình */}
                <div style={{ marginTop: '10px' }}>
                    <label>Model Rotation Y: {(rotationY / Math.PI).toFixed(2)}π</label>
                    <input
                        type="range"
                        min="0"
                        max={2 * Math.PI}
                        step="0.1"
                        value={rotationY}
                        onChange={(e) => setRotationY(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Model3DRecorder;