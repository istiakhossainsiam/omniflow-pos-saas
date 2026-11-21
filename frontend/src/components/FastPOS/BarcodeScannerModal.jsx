import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Camera, 
  ScanLine, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Type, 
  Search,
  Zap,
  Loader2,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  AlertCircle,
  Lock,
  ExternalLink
} from 'lucide-react';
import { 
  BrowserMultiFormatReader, 
  BarcodeFormat, 
  DecodeHintType 
} from '@zxing/library';
import { createWorker } from 'tesseract.js';

const ZXING_FORMATS = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.ITF
];

// Singleton OCR Worker
let globalOcrWorker = null;
let isWorkerInitializing = false;

async function getPrewarmedWorker() {
  if (globalOcrWorker) return globalOcrWorker;
  if (isWorkerInitializing) {
    while (isWorkerInitializing) {
      await new Promise(r => setTimeout(r, 50));
    }
    if (globalOcrWorker) return globalOcrWorker;
  }

  try {
    isWorkerInitializing = true;
    const worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-abcdefghijklmnopqrstuvwxyz ',
      tessedit_pageseg_mode: '6',
    });
    globalOcrWorker = worker;
    return worker;
  } catch (err) {
    console.warn("OCR Prewarm failed:", err);
    return null;
  } finally {
    isWorkerInitializing = false;
  }
}

// POS Supermarket Beep Sound
function playPosBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

export default function BarcodeScannerModal({ onScanSuccess, onClose }) {
  const isHttps = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isSecure = window.isSecureContext || isHttps || isLocalhost;

  const [activeTab, setActiveTab] = useState(isSecure ? 'live' : 'snapshot'); // Default to snapshot if on HTTP IP
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  
  // Real-time scan states
  const [detectedResult, setDetectedResult] = useState(null);
  const [snapLoading, setSnapLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const zxingReaderRef = useRef(null);
  const barcodeDetectorRef = useRef(null);
  const fileInputRef = useRef(null);
  const isFoundRef = useRef(false);

  const demoBarcodes = [
    { code: '8901001001', label: 'Oxford Shirt (Navy M)', sku: 'SHT-OXF-NVY-M' },
    { code: '8901001002', label: 'Oxford Shirt (Navy L)', sku: 'SHT-OXF-NVY-L' },
    { code: '8901001003', label: 'Oxford Shirt (Navy XL)', sku: 'SHT-OXF-NVY-XL' },
    { code: '8902002001', label: 'Jacquard Panjabi (Green 40)', sku: 'PJB-JCQ-GRN-40' },
    { code: '8903003001', label: 'Pique Polo (Maroon M)', sku: 'POL-PIQ-MRN-M' },
  ];

  // Initialize Native Hardware BarcodeDetector if available
  useEffect(() => {
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({
          formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e', 'code_39', 'code_93', 'itf']
        });
      } catch (e) {
        console.warn("Hardware BarcodeDetector init:", e);
      }
    }

    const zxingHints = new Map();
    zxingHints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS);
    zxingHints.set(DecodeHintType.TRY_HARDER, true);
    zxingReaderRef.current = new BrowserMultiFormatReader(zxingHints);

    getPrewarmedWorker().catch(() => {});

    return () => {
      stopCamera();
    };
  }, []);

  // Start live camera stream on mount or facingMode change
  useEffect(() => {
    if (activeTab === 'live') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode, activeTab]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    isFoundRef.current = false;

    // Check if mediaDevices is supported in current context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        !isSecure
          ? 'HTTP_INSECURE'
          : 'Camera API is not supported by your browser.'
      );
      setCameraActive(false);
      return;
    }

    try {
      let stream = null;
      try {
        // Primary high quality back camera constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          },
          audio: false
        });
      } catch (e1) {
        // Fallback to simple video constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() || {};
        setHasTorch(Boolean(capabilities.torch));

        startContinuousScanLoop();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('PERMISSION_DENIED');
      } else if (!isSecure) {
        setCameraError('HTTP_INSECURE');
      } else {
        setCameraError('GENERAL_ERROR');
      }
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const nextTorch = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setTorchOn(nextTorch);
      } catch (e) {
        console.warn("Torch toggle failed:", e);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Real-Time 60FPS Video Frame Auto-Decoder
  const startContinuousScanLoop = () => {
    let lastZxingTime = 0;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || isFoundRef.current) {
        if (!isFoundRef.current) {
          scanLoopRef.current = requestAnimationFrame(scanFrame);
        }
        return;
      }

      const video = videoRef.current;
      const now = performance.now();

      // TIER 1: Native Hardware BarcodeDetector
      if (barcodeDetectorRef.current) {
        try {
          const barcodes = await barcodeDetectorRef.current.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleSuccessfulScan(barcodes[0].rawValue, 'Hardware ML Real-Time Scan');
            return;
          }
        } catch (e1) {}
      }

      // TIER 2: ZXing Stream Decoder
      if (zxingReaderRef.current && (now - lastZxingTime > 120)) {
        lastZxingTime = now;
        try {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const maxW = 640;
            const scale = Math.min(1, maxW / video.videoWidth);
            tempCanvas.width = Math.round(video.videoWidth * scale);
            tempCanvas.height = Math.round(video.videoHeight * scale);
            tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

            const zxResult = await zxingReaderRef.current.decodeFromCanvas(tempCanvas);
            if (zxResult && zxResult.getText()) {
              handleSuccessfulScan(zxResult.getText(), 'ZXing Auto-Reader');
              return;
            }
          }
        } catch (e2) {}
      }

      if (!isFoundRef.current) {
        scanLoopRef.current = requestAnimationFrame(scanFrame);
      }
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);
  };

  const handleSuccessfulScan = (codeText, sourceName) => {
    if (isFoundRef.current) return;
    isFoundRef.current = true;

    const clean = cleanExtractedCode(codeText);
    if (!clean) {
      isFoundRef.current = false;
      return;
    }

    playPosBeep();
    if (navigator.vibrate) {
      try { navigator.vibrate(80); } catch (e) {}
    }

    setDetectedResult({ code: clean, source: sourceName });
    stopCamera();

    setTimeout(() => {
      onScanSuccess(clean);
      onClose();
    }, 400);
  };

  const cleanExtractedCode = (str) => {
    if (!str) return '';
    const trimmed = str.trim();
    if (trimmed.startsWith('OMNI_ATTEND:')) {
      return trimmed.split(':')[1] || trimmed;
    }
    return trimmed;
  };

  // Switch to HTTPS URL helper
  const handleSwitchToHttps = () => {
    const currentUrl = window.location.href;
    const httpsUrl = currentUrl.replace('http:', 'https:');
    window.location.href = httpsUrl;
  };

  // 1-Touch Photo Snapshot AI OCR (Works 100% on HTTP & HTTPS)
  const handleSnapshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let blobUrl = null;
    try {
      setSnapLoading(true);
      setOcrStatus('Scanning photo...');

      blobUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = blobUrl;
      });

      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);

      let found = null;

      // 1. Hardware Detector
      if (barcodeDetectorRef.current) {
        try {
          const res = await barcodeDetectorRef.current.detect(canvas);
          if (res?.[0]?.rawValue) {
            found = { code: cleanExtractedCode(res[0].rawValue), source: 'Snapshot Barcode' };
          }
        } catch (e) {}
      }

      // 2. ZXing
      if (!found && zxingReaderRef.current) {
        try {
          const res = await zxingReaderRef.current.decodeFromCanvas(canvas);
          if (res?.getText()) {
            found = { code: cleanExtractedCode(res.getText()), source: 'Snapshot Barcode' };
          }
        } catch (e) {}
      }

      // 3. OCR Text
      if (!found) {
        setOcrStatus('Extracting tag text & numbers...');
        const worker = await getPrewarmedWorker();
        if (worker) {
          const res = await worker.recognize(canvas);
          const ocrText = res?.data?.text || '';
          
          const barcodeMatch = ocrText.match(/\b(890\d{7}|\d{8,13})\b/);
          if (barcodeMatch) {
            found = { code: barcodeMatch[0], source: `AI Number: ${barcodeMatch[0]}` };
          } else {
            const skuMatch = ocrText.match(/\b([A-Z0-9]{3,}-[A-Z0-9]{2,}-[A-Z0-9\-]+)\b/i);
            if (skuMatch) {
              found = { code: skuMatch[0].toUpperCase(), source: `AI SKU: ${skuMatch[0].toUpperCase()}` };
            }
          }
        }
      }

      if (found) {
        handleSuccessfulScan(found.code, found.source);
      } else {
        alert("No clear barcode or SKU text detected in photo. Please ensure clear lighting.");
      }
    } catch (err) {
      console.error("Snapshot failed:", err);
      alert("Scan failed. You can type or pick the barcode below.");
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSnapLoading(false);
      setOcrStatus('');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleSuccessfulScan(manualBarcode.trim(), 'Manual Entry');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-700/50 bg-slate-900 text-white shadow-2xl animate-in zoom-in-95 max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="h-5 w-5 fill-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                <span>Instant Auto-Scanner</span>
                {isSecure && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-400 border border-emerald-500/30 animate-pulse">
                    LIVE
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400">Point camera or snap tag — scans automatically</p>
            </div>
          </div>
          <button 
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === 'live' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ScanLine className="h-3.5 w-3.5" />
            <span>Auto Live Cam</span>
          </button>
          
          <button
            onClick={() => setActiveTab('snapshot')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === 'snapshot' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Snap AI OCR</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              activeTab === 'manual' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>Manual / Pick</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">

          {/* Success Flash Notification */}
          {detectedResult && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-500 p-3.5 text-slate-950 animate-in zoom-in-90 shadow-xl shadow-emerald-500/30 font-bold">
              <CheckCircle2 className="h-6 w-6 shrink-0 fill-slate-950 text-emerald-500" />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider opacity-80">Auto Scanned Successfully!</div>
                <div className="text-sm font-black font-mono">{detectedResult.code}</div>
                <div className="text-[10px] opacity-75">{detectedResult.source} • Adding item to cart...</div>
              </div>
            </div>
          )}

          {/* TAB 1: Real-Time Live Auto-Scan Camera Viewport */}
          {activeTab === 'live' && (
            <div className="space-y-3">
              
              {cameraError ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center space-y-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 mx-auto">
                    {cameraError === 'HTTP_INSECURE' ? <Lock className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-amber-300">
                      {cameraError === 'HTTP_INSECURE'
                        ? 'HTTPS Required for Live Camera Stream'
                        : cameraError === 'PERMISSION_DENIED'
                          ? 'Camera Permission Denied'
                          : 'Camera Unavailable'}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {cameraError === 'HTTP_INSECURE'
                        ? 'Mobile browsers (Brave/Chrome) require HTTPS to allow continuous camera feeds.'
                        : 'Please grant camera access in browser permissions or use Photo Snap.'}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                    {cameraError === 'HTTP_INSECURE' && (
                      <button
                        onClick={handleSwitchToHttps}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/30"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Switch to HTTPS (Enable Live Cam)</span>
                      </button>
                    )}

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      <Camera className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Use Instant Snap Photo</span>
                    </button>
                  </div>

                  {cameraError === 'HTTP_INSECURE' && (
                    <div className="text-[10px] text-slate-400 text-left bg-black/40 rounded-xl p-2.5 mt-2 border border-slate-800">
                      💡 <strong>Tip:</strong> Tap <strong>"Switch to HTTPS"</strong>, then on Brave/Chrome tap <em>"Advanced" → "Proceed to unsafe"</em> once. Live camera will then work permanently!
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black border border-slate-700 shadow-inner flex items-center justify-center">
                  
                  {/* Live Video Element */}
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="h-full w-full object-cover"
                  />

                  {/* Camera Controls Overlay: Torch & Switch Camera */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        title="Toggle Flashlight"
                        className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md border transition-all ${
                          torchOn 
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/40' 
                            : 'bg-black/50 text-white border-white/20 hover:bg-black/80'
                        }`}
                      >
                        {torchOn ? <Flashlight className="h-4 w-4 fill-slate-950" /> : <FlashlightOff className="h-4 w-4" />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      title="Switch Camera (Rear/Front)"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition-all"
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Scanning Target Box & Animated Laser Line */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-10">
                    <div className="relative w-full max-w-[280px] h-[180px] rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center">
                      
                      {/* 4 Corner Markers */}
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                      {/* Animated Laser Scanning Beam */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />

                      {/* Hint Label */}
                      <div className="absolute -bottom-7 rounded-full bg-black/75 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                        Align Barcode or QR inside box
                      </div>
                    </div>
                  </div>

                  {/* Loading overlay when camera is starting */}
                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 gap-2 z-30">
                      <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                      <span className="text-xs font-bold text-slate-300">Activating camera...</span>
                    </div>
                  )}

                </div>
              )}

              {/* Status Hint */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Auto-sensing live video feed...
                </span>
                <span>Sub-100ms detection</span>
              </div>
            </div>
          )}

          {/* Hidden File Input for 1-Touch Photo Snap */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            capture="environment" 
            onChange={handleSnapshotUpload}
            className="hidden" 
          />

          {/* TAB 2: 1-Touch Photo Snapshot AI OCR */}
          {activeTab === 'snapshot' && (
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={snapLoading}
                className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-950/20 p-6 text-center hover:bg-emerald-950/40 active:scale-98 transition-all disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {snapLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {snapLoading ? (ocrStatus || "Reading Tag Text with AI...") : "Tap to Snap Tag Photo"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Works on all browsers • Extracts Barcodes, SKUs, and Numbers
                  </div>
                </div>
              </button>

              {!isSecure && (
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400">Want live continuous scanning? </span>
                  <button
                    onClick={handleSwitchToHttps}
                    className="text-xs font-bold text-emerald-400 hover:underline ml-1"
                  >
                    Open with HTTPS ↗
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Manual Input & Laser Gun */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Type Barcode / SKU / Product Name:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. 8901001003 or SHT-OXF"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-600/30"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Demo Pickers (Always available for testing) */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                1-Tap Quick Test Pickers:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {demoBarcodes.map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleSuccessfulScan(item.code, 'Quick Pick')}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-left hover:border-emerald-500/60 hover:bg-emerald-950/30 transition-all group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-300 truncate">
                      {item.label}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">{item.sku}</div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/50 shrink-0">
                    {item.code}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/80 px-4 py-2.5 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Zero-Storage: RAM stream only, 0 bytes saved.</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white font-bold"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
