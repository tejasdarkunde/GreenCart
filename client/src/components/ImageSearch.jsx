import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

const ImageSearch = ({ onResults }) => {
    const { axios } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState(null);
    const [recognized, setRecognized] = useState([]);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const [useCamera, setUseCamera] = useState(false);
    const [stream, setStream] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setPreview(event.target.result);
            processImage(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            setUseCamera(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera access denied:', err);
            // Fallback to file upload
            fileInputRef.current?.click();
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        setPreview(imageData);
        stopCamera();
        processImage(imageData);
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setUseCamera(false);
    };

    const processImage = async (imageData) => {
        setIsProcessing(true);
        setRecognized([]);

        try {
            const { data } = await axios.post('/api/ai/recognize-image', { image: imageData });

            if (data.success) {
                setRecognized(data.recognized || []);
                if (data.products && data.products.length > 0) {
                    onResults?.(data.products, data.recognized);
                }
            }
        } catch (err) {
            console.error('Image recognition failed:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setPreview(null);
        setRecognized([]);
        stopCamera();
    };

    const close = () => {
        reset();
        setIsOpen(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-500 hover:border-green-400 hover:text-green-500 transition cursor-pointer bg-white"
                title="Search by image"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                📸 Image Search
            </button>
        );
    }

    return (
        <div className="border border-green-300 rounded-xl p-4 bg-green-50/50 transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📸</span>
                    <h3 className="text-sm font-medium text-gray-700">AI Image Search</h3>
                    <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Beta</span>
                </div>
                <button onClick={close} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Camera / Upload area */}
            {!preview && !useCamera && (
                <div className="flex gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition cursor-pointer bg-white"
                    >
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500">Upload Photo</span>
                    </button>
                    <button
                        onClick={startCamera}
                        className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition cursor-pointer bg-white"
                    >
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs text-gray-500">Use Camera</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </div>
            )}

            {/* Camera View */}
            {useCamera && (
                <div className="relative rounded-lg overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-h-48 object-cover rounded-lg"
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={capturePhoto}
                            className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition cursor-pointer"
                        >
                            📸 Capture
                        </button>
                        <button
                            onClick={stopCamera}
                            className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Preview & Results */}
            {preview && (
                <div>
                    <div className="relative">
                        <img src={preview} alt="Preview" className="w-full max-h-40 object-cover rounded-lg" />
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                                <div className="flex items-center gap-2 text-white text-sm">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Analyzing image...
                                </div>
                            </div>
                        )}
                    </div>

                    {recognized.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">Found:</span>
                            {recognized.map((item, i) => (
                                <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                    {item}
                                </span>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={reset}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                        Try another image
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageSearch;
