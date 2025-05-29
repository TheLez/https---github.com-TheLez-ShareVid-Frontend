import React, { useEffect, useRef, useState } from 'react';
import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import './Model3DRecorder.scss';

// Giải nén từ vision
const { PoseLandmarker, FilesetResolver } = vision;

const Model3DRecorder = ({ onRecordingStart, onRecordingStop }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const vrmRef = useRef(null);
    const recorderRef = useRef(null);
    const audioContextRef = useRef(null); // Lưu AudioContext để sử dụng khi ghi hình
    const poseLandmarkerRef = useRef(null);
    const streamRef = useRef(null); // Lưu luồng video và âm thanh từ webcam
    const clockRef = useRef(new THREE.Clock());
    const [vrmLoaded, setVrmLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // State để điều chỉnh camera.position.z, vị trí Y, và rotation Y
    const [cameraZ, setCameraZ] = useState(0.5);
    const [modelY, setModelY] = useState(-1.5);
    const [rotationY, setRotationY] = useState(0);

    // State để lưu trữ hình ảnh nền
    const [backgroundImage, setBackgroundImage] = useState(null);

    useEffect(() => {
        // Log để kiểm tra import
        console.log('FilesetResolver:', FilesetResolver);
        console.log('PoseLandmarker:', PoseLandmarker);

        // Khởi tạo Three.js
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = cameraZ;
        cameraRef.current = camera;
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        renderer.setSize(window.innerWidth, window.innerHeight);
        rendererRef.current = renderer;

        // Thêm ánh sáng
        const light = new THREE.DirectionalLight(0xffffff, 0.8);
        light.position.set(1, 1, 1);
        scene.add(light);

        // Khởi tạo PoseLandmarker
        const initPoseLandmarker = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
                );
                console.log('FilesetResolver khởi tạo thành công');
                const poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                        delegate: 'GPU',
                    },
                    runningMode: 'VIDEO',
                    numPoses: 1,
                    minPoseDetectionConfidence: 0.3,
                    minPosePresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                    outputImageWidth: 640,
                    outputImageHeight: 480,
                });
                poseLandmarkerRef.current = poseLandmarker;
                setIsMediaPipeReady(true);
                console.log('PoseLandmarker khởi tạo thành công');
            } catch (err) {
                setError('Lỗi khi khởi tạo PoseLandmarker: ' + err.message);
                console.error('Lỗi khởi tạo PoseLandmarker:', err);
            }
        };
        initPoseLandmarker();

        // Khởi động webcam và microphone
        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                streamRef.current = stream; // Lưu luồng video và âm thanh
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
            if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
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

    // Cập nhật camera.position.z, vị trí Y, rotation Y, và background khi state thay đổi
    useEffect(() => {
        if (cameraRef.current) {
            cameraRef.current.position.z = cameraZ;
        }
        if (vrmRef.current) {
            vrmRef.current.scene.position.y = modelY;
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
    }, [cameraZ, modelY, rotationY, backgroundImage]);

    // Phát hiện tư thế
    useEffect(() => {
        let blinkTimer = 0;
        const blinkInterval = 3; // Nháy mắt mỗi 3 giây
        const detectPoses = async () => {
            if (!poseLandmarkerRef.current || !videoRef.current || !vrmRef.current) {
                console.warn('PoseLandmarker, video, hoặc VRM chưa sẵn sàng');
                return;
            }

            try {
                const results = await poseLandmarkerRef.current.detectForVideo(
                    videoRef.current,
                    performance.now()
                );
                console.log('MediaPipe results:', results);
                if (results.landmarks && results.landmarks[0]) {
                    const landmarks = results.landmarks[0];
                    console.log('Landmarks:', landmarks);
                    const leftEar = landmarks[7]; // Tai trái
                    const rightEar = landmarks[8]; // Tai phải
                    const nose = landmarks[0]; // Mũi
                    const mouthLeft = landmarks[9]; // Miệng trái
                    const mouthRight = landmarks[10]; // Miệng phải

                    const headBone = vrmRef.current.humanoid.getNormalizedBoneNode('head');
                    if (headBone && leftEar && rightEar && nose && mouthLeft && mouthRight) {
                        // Tính góc yaw từ tai
                        const dx = rightEar.x - leftEar.x;
                        const dy = rightEar.y - leftEar.y;
                        const yaw = Math.atan2(dy, dx);
                        const yawSensitivity = 4;
                        console.log('Yaw angle:', yaw);
                        headBone.rotation.y = yaw * yawSensitivity;

                        // Tính góc pitch từ mũi
                        const centerY = 0.5;
                        const pitchSensitivity = 1.5;
                        const pitch = (nose.y - centerY) * Math.PI * pitchSensitivity;
                        console.log('Pitch angle:', pitch);
                        headBone.rotation.x = pitch;

                        // Ước lượng mở miệng bằng khoảng cách dọc từ mũi đến điểm giữa miệng
                        const mouthMidY = (mouthLeft.y + mouthRight.y) / 2;
                        const dist = mouthMidY - nose.y;
                        const minDist = 0.05;
                        const maxDist = 0.15;
                        const mouthOpenness = Math.min(Math.max((dist - minDist) / (maxDist - minDist), 0), 1);
                        console.log('Mouth distance:', dist);
                        console.log('Mouth openness:', mouthOpenness);
                        vrmRef.current.expressionManager.setValue('a', mouthOpenness);

                        // Thử cách cũ với khoảng cách ngang, tăng hệ số nhân
                        const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
                        const mouthOpennessHorizontal = Math.min(Math.max(mouthWidth * 10, 0), 1);
                        console.log('Mouth openness (horizontal):', mouthOpennessHorizontal);

                        // Mô phỏng nháy mắt định kỳ
                        blinkTimer += clockRef.current.getDelta();
                        if (blinkTimer > blinkInterval) {
                            vrmRef.current.expressionManager.setValue('blink', 1);
                            setTimeout(() => {
                                vrmRef.current.expressionManager.setValue('blink', 0);
                            }, 200);
                            blinkTimer = 0;
                        }
                    } else {
                        console.warn('Thiếu landmarks hoặc bone head');
                    }
                } else {
                    console.warn('Không nhận diện được landmarks từ MediaPipe');
                }
            } catch (err) {
                console.error('Lỗi phát hiện tư thế:', err);
            }
            requestAnimationFrame(detectPoses);
        };

        if (isMediaPipeReady && vrmLoaded) {
            console.log('Bắt đầu nhận diện tư thế...');
            detectPoses();
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
                        leftUpperArm.rotation.z = -Math.PI / 2.2;
                        console.log('Adjusted leftUpperArm rotation.z:', leftUpperArm.rotation.z);
                    } else {
                        console.warn('Không tìm thấy bone leftUpperArm');
                    }
                    if (rightUpperArm) {
                        rightUpperArm.rotation.z = Math.PI / 2.2;
                        console.log('Adjusted rightUpperArm rotation.z:', rightUpperArm.rotation.z);
                    } else {
                        console.warn('Không tìm thấy bone rightUpperArm');
                    }
                    if (leftLowerArm) {
                        leftLowerArm.rotation.z = 0.2;
                        console.log('Adjusted leftLowerArm rotation.z:', leftLowerArm.rotation.z);
                    }
                    if (rightLowerArm) {
                        rightLowerArm.rotation.z = -0.2;
                        console.log('Adjusted rightLowerArm rotation.z:', rightLowerArm.rotation.z);
                    }

                    // Điều chỉnh vị trí và xoay model
                    vrm.scene.position.set(0, modelY, 0);
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
            setError('PoseLandmarker chưa sẵn sàng');
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
                {/* Thanh trượt điều chỉnh camera.position.z */}
                <div style={{ marginTop: '10px' }}>
                    <label>Camera Z: {cameraZ.toFixed(2)}</label>
                    <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={cameraZ}
                        onChange={(e) => setCameraZ(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
                {/* Thanh trượt điều chỉnh vị trí Y của mô hình */}
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