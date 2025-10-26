import { useState, useEffect, useRef, useCallback } from 'react';
import { CrowdData, RiskLevel, BoundingBox } from '../types';
import { getCrowdRecommendations } from '../services/geminiService';

declare global {
  interface Window {
    cocoSsd: any;
  }
}

const DETECTION_INTERVAL_MS = 100; // How often to run detection
const CONFIDENCE_THRESHOLD = 0.6; 

interface TrackedPerson {
  id: number;
  bbox: BoundingBox;
  lastSeen: number; // Timestamp of the last frame it was seen
}

// Helper function to calculate Intersection over Union (IoU)
const calculateIoU = (box1: BoundingBox, box2: BoundingBox): number => {
  const xA = Math.max(box1.x, box2.x);
  const yA = Math.max(box1.y, box2.y);
  const xB = Math.min(box1.x + box1.width, box2.x + box2.width);
  const yB = Math.min(box1.y + box1.height, box2.y + box2.height);

  const intersectionArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  if (intersectionArea === 0) return 0;

  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;

  const iou = intersectionArea / (box1Area + box2Area - intersectionArea);
  return iou;
};

const usePersonDetection = (
  isAnalyzing: boolean,
  videoRef: React.RefObject<HTMLVideoElement>,
  intervalMs: number = DETECTION_INTERVAL_MS
) => {
  const [model, setModel] = useState<any | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [crowdData, setCrowdData] = useState<CrowdData | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);
  
  const trackedPeopleRef = useRef<Map<number, TrackedPerson>>(new Map());
  const nextIdRef = useRef<number>(0);
  const previousRiskLevel = useRef<RiskLevel | null>(null);

  // Load the COCO-SSD model
  useEffect(() => {
    if (isAnalyzing && !model && !isModelLoading) {
      setIsModelLoading(true);
      window.cocoSsd.load().then((loadedModel: any) => {
        setModel(loadedModel);
        setIsModelLoading(false);
        console.log("Person detection model loaded.");
      }).catch((error: any) => {
        console.error("Error loading COCO-SSD model:", error);
        setIsModelLoading(false);
      });
    }
  }, [isAnalyzing, model, isModelLoading]);
  
  // Stop analysis when camera turns off
  useEffect(() => {
    if (!isAnalyzing) {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        setCrowdData(null);
        trackedPeopleRef.current.clear();
        nextIdRef.current = 0;
    }
  },[isAnalyzing])

  // Effect to fetch recommendations when risk level changes
  useEffect(() => {
    if (!crowdData) return;

    const currentRisk = crowdData.riskLevel;
    if (currentRisk !== previousRiskLevel.current && (currentRisk === RiskLevel.MODERATE || currentRisk === RiskLevel.HIGH)) {
        const fetchRecs = async () => {
            setIsLoadingRecommendations(true);
            try {
                const recommendations = await getCrowdRecommendations(crowdData);
                setCrowdData(prevData => {
                    if (!prevData || prevData.timestamp > crowdData.timestamp) return prevData;
                    return { ...prevData, recommendations };
                });
            } catch (error) {
                console.error("Failed to fetch and set recommendations:", error);
            } finally {
                setIsLoadingRecommendations(false);
            }
        };
        fetchRecs();
    }
    previousRiskLevel.current = crowdData.riskLevel;
  }, [crowdData]);

  const detectFrame = useCallback(async () => {
    if (!isAnalyzing || !model || !videoRef.current || videoRef.current.readyState < 3) {
      if(isAnalyzing) animationFrameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const timestamp = performance.now();
    if (timestamp - lastDetectionTimeRef.current > intervalMs) {
      lastDetectionTimeRef.current = timestamp;

      const video = videoRef.current;
      const predictions = await model.detect(video);
      
      const newDetections: BoundingBox[] = predictions
        .filter((p: any) => p.class === 'person' && p.score > CONFIDENCE_THRESHOLD)
        .map((p: any) => ({
            x: p.bbox[0] / video.videoWidth,
            y: p.bbox[1] / video.videoHeight,
            width: p.bbox[2] / video.videoWidth,
            height: p.bbox[3] / video.videoHeight,
        }));

      const now = performance.now();
      const matchedTrackedIds = new Set<number>();
      const matchedDetectionIndices = new Set<number>();

      // Match new detections with existing tracked people
      trackedPeopleRef.current.forEach((person, id) => {
          let bestMatchIndex = -1;
          let bestMatchIoU = 0.4; // IoU threshold
          newDetections.forEach((detection, index) => {
              if (!matchedDetectionIndices.has(index)) {
                  const iou = calculateIoU(person.bbox, detection);
                  if (iou > bestMatchIoU) {
                      bestMatchIoU = iou;
                      bestMatchIndex = index;
                  }
              }
          });

          if (bestMatchIndex !== -1) {
              person.bbox = newDetections[bestMatchIndex];
              person.lastSeen = now;
              matchedTrackedIds.add(id);
              matchedDetectionIndices.add(bestMatchIndex);
          }
      });

      // Add new, unmatched detections as new people
      newDetections.forEach((detection, index) => {
          if (!matchedDetectionIndices.has(index)) {
              const newId = nextIdRef.current++;
              trackedPeopleRef.current.set(newId, {
                  id: newId,
                  bbox: detection,
                  lastSeen: now,
              });
          }
      });

      // Remove people who haven't been seen for a while (grace period)
      const GRACE_PERIOD_MS = 500; // 0.5 seconds
      trackedPeopleRef.current.forEach((person, id) => {
          if (now - person.lastSeen > GRACE_PERIOD_MS) {
              trackedPeopleRef.current.delete(id);
          }
      });

      const currentTrackedPeople = Array.from(trackedPeopleRef.current.values());

      // --- Analysis ---
      const totalCount = currentTrackedPeople.length;
      const density = totalCount / 200; // Hypothetical area

      let riskLevel: RiskLevel;
      if (density < 0.3) riskLevel = RiskLevel.SAFE;
      else if (density < 0.55) riskLevel = RiskLevel.MODERATE;
      else riskLevel = RiskLevel.HIGH;

      const detections = currentTrackedPeople.map(p => p.bbox);

      // A simple congestion point algorithm: find the center of mass
      let congestionPoints: { x: number, y: number }[] = [];
      if (detections.length > 5) {
          const centerX = detections.reduce((sum, d) => sum + d.x + d.width / 2, 0) / detections.length;
          const centerY = detections.reduce((sum, d) => sum + d.y + d.height / 2, 0) / detections.length;
          congestionPoints.push({ x: centerX, y: centerY });
      }

      setCrowdData({
        totalCount, density, riskLevel, congestionPoints, detections,
        recommendations: crowdData?.recommendations || [], // Preserve old recommendations until new ones are fetched
        timestamp: Date.now(),
      });
    }
    
    animationFrameRef.current = requestAnimationFrame(detectFrame);
  }, [isAnalyzing, model, videoRef, intervalMs, crowdData]);

  useEffect(() => {
    if (isAnalyzing && model) {
      detectFrame();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnalyzing, model, detectFrame]);

  return { crowdData, isModelLoading, isLoadingRecommendations };
};

export default usePersonDetection;
