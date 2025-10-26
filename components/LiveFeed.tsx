import React, { useEffect, useRef } from 'react';
import { BoundingBox } from '../types';
import { VideoSource } from '../hooks/useCamera';

interface LiveFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  detections: BoundingBox[];
  heatmapPoints?: { x: number; y: number; intensity: number }[];
  source: VideoSource;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ videoRef, detections, heatmapPoints, source }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Maintain a 16:9 aspect ratio for rendering
    const canvasWidth = canvas.parentElement?.clientWidth || 1280;
    const canvasHeight = (canvasWidth / 16) * 9;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw heatmap first
    if (heatmapPoints && heatmapPoints.length > 0) {
        ctx.globalCompositeOperation = 'lighter'; 
        heatmapPoints.forEach(point => {
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;
            const radius = 40; 
            const intensityRadius = radius + (50 * point.intensity);

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, intensityRadius);
            gradient.addColorStop(0, `rgba(248, 113, 113, ${0.1 + 0.4 * point.intensity})`); // Brighter, warmer center
            gradient.addColorStop(0.5, `rgba(250, 204, 21, ${0.2 * point.intensity})`);
            gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, intensityRadius, 0, 2 * Math.PI);
            ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over'; 
    }

    // Draw detections on top of heatmap
    detections.forEach(box => {
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)'; // Teal color
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x * canvas.width, box.y * canvas.height, box.width * canvas.width, box.height * canvas.height);
    });

  }, [detections, heatmapPoints]);

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${source === 'default' ? 'transform -scale-x-1' : ''}`} // Conditionally mirrored view
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"></canvas>
    </div>
  );
};

export default LiveFeed;