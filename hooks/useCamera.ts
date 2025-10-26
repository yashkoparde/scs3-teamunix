import { useState, useRef, useCallback } from 'react';

export type VideoSource = 'default' | 'drone1' | 'drone2' | 'external';

const VIDEO_SOURCES = {
  drone1: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  drone2: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  external: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
};

const useCamera = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
      videoRef.current.load();
    }
    
    setIsCameraOn(false);
  }, []);

  const startCamera = useCallback(async (source: VideoSource) => {
    if (isCameraOn) stopCamera();

    try {
      if (source === 'default') {
        const constraints: MediaStreamConstraints = {
          video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
          },
          audio: false,
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.src = '';
          await videoRef.current.play();
        }
      } else {
        if (videoRef.current) {
          const videoUrl = VIDEO_SOURCES[source as keyof typeof VIDEO_SOURCES];
          videoRef.current.srcObject = null;
          videoRef.current.src = videoUrl;
          videoRef.current.loop = true;
          videoRef.current.crossOrigin = "anonymous";
          await videoRef.current.play();
        }
      }
      setIsCameraOn(true);
    } catch (err) {
      console.error(`Error starting video source ${source}:`, err);
      setIsCameraOn(false);
      alert(`Could not start video source: ${source}. Please ensure camera permissions are granted and try another source.`);
    }
  }, [isCameraOn, stopCamera]);

  return { 
    videoRef, 
    isCameraOn, 
    startCamera,
    stopCamera,
  };
};

export default useCamera;