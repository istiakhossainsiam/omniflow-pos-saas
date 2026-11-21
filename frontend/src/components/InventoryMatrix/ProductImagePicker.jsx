import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, RefreshCw, CheckCircle2, Image as ImageIcon, Sparkles, X, SwitchCamera } from 'lucide-react';

/**
 * ProductImagePicker
 * WebP Auto-Converting Image Picker with Live Camera Capture & File Upload.
 * Exclusively optimized for Clothing Matrix Catalog.
 */
export default function ProductImagePicker({ value, onChange, label = "Product Image (Optional)" }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'
  const [isConverting, setIsConverting] = useState(false);
  const [imageSizeKb, setImageSizeKb] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Compute size in KB if value exists
  useEffect(() => {
    if (value && typeof value === 'string' && value.startsWith('data:')) {
      const stringLength = value.length - 'data:image/webp;base64,'.length;
      const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383424; // approximate decoded bytes
      setImageSizeKb(Math.max(1, Math.round(sizeInBytes / 1024)));
    } else if (value) {
      setImageSizeKb(null);
    }
  }, [value]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (facing = cameraFacing) => {
    setErrorMsg(null);
    stopCamera();
    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 1280 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      // Fallback without specific facingMode if constrained
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (fallbackErr) {
        setErrorMsg("Unable to access camera. Please allow camera permissions or upload a file.");
        setIsCameraActive(false);
      }
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Convert an HTMLImageElement or Canvas to WebP Base64 with high compression
  const convertToWebP = (imgSource, originalWidth, originalHeight) => {
    return new Promise((resolve, reject) => {
      try {
        const MAX_DIMENSION = 800; // Optimal size for high DPI mobile & desktop POS display
        let width = originalWidth;
        let height = originalHeight;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Render with high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imgSource, 0, 0, width, height);

        // Export as webp with 82% quality (balanced high clarity & low footprint)
        let webpDataUrl = canvas.toDataURL('image/webp', 0.82);

        // Fallback for rare browsers without webp canvas export
        if (!webpDataUrl.startsWith('data:image/webp')) {
          webpDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        }

        resolve(webpDataUrl);
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;
    try {
      setIsConverting(true);
      const video = videoRef.current;
      const webpData = await convertToWebP(video, video.videoWidth || 640, video.videoHeight || 480);
      onChange(webpData);
      stopCamera();
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
      setErrorMsg("Failed to capture image. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg("Please select a valid image file (JPG, PNG, WEBP, etc.)");
      return;
    }

    setIsConverting(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const webpData = await convertToWebP(img, img.naturalWidth, img.naturalHeight);
          onChange(webpData);
        } catch (err) {
          console.error("WebP conversion error:", err);
          setErrorMsg("Could not convert image to WebP format.");
        } finally {
          setIsConverting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      img.onerror = () => {
        setIsConverting(false);
        setErrorMsg("Failed to load image file.");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onChange(null);
    setImageSizeKb(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <Sparkles className="h-3 w-3" /> Auto WebP Converter
        </span>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200 animate-in fade-in">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Camera Live Stream View */}
      {isCameraActive ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-black shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-56 w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 flex items-center justify-between">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
              title="Switch Camera (Front/Back)"
            >
              <SwitchCamera className="h-4 w-4" />
              <span className="hidden sm:inline">Flip</span>
            </button>

            <button
              type="button"
              onClick={handleCaptureSnapshot}
              disabled={isConverting}
              className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-5 py-2 text-xs font-bold shadow-lg transition-transform"
            >
              <Camera className="h-4 w-4" />
              {isConverting ? 'Processing...' : 'Capture Photo'}
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="flex items-center gap-1 rounded-xl bg-white/20 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600/80 transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          </div>
        </div>
      ) : value ? (
        /* Image Preview View */
        <div className="relative flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-inner">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
            <img
              src={value}
              alt="Clothing product preview"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Optimized Clothing Visual</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span className="rounded bg-emerald-100/70 text-emerald-800 font-bold px-1.5 py-0.2">.WEBP</span>
              {imageSizeKb && (
                <span className="rounded bg-slate-200/80 text-slate-700 font-medium px-1.5 py-0.2">~{imageSizeKb} KB</span>
              )}
              <span className="text-[10px] text-slate-400">High speed POS display</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Change
              </button>
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Camera className="h-3 w-3" /> Retake
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 transition-colors ml-auto"
                title="Remove photo"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Picker Action Buttons */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => startCamera('environment')}
            disabled={isConverting}
            className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 p-3.5 text-xs font-bold text-emerald-800 transition-all group active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition-transform">
              <Camera className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div>Take Live Photo</div>
              <div className="text-[10px] font-normal text-emerald-600">Instant camera capture</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isConverting}
            className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-400 p-3.5 text-xs font-bold text-slate-700 transition-all group active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm group-hover:scale-105 transition-transform">
              <Upload className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div>{isConverting ? 'Optimizing...' : 'Upload from File'}</div>
              <div className="text-[10px] font-normal text-slate-500">Auto converts to WebP</div>
            </div>
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
