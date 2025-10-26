import React, { useState, useCallback, useEffect, useRef } from 'react';
import useCamera, { VideoSource } from '../hooks/useCamera';
import usePersonDetection from '../hooks/usePersonDetection';
import useAlerts from '../hooks/useAlerts';
import LiveFeed from './LiveFeed';
import StatsPanel from './StatsPanel';
import ChatAssistant from './ChatAssistant';
import { CrowdData, RiskLevel } from '../types';
import { PlayIcon, StopIcon, ChatAssistantIcon, CameraIcon } from './index';
import { motion, AnimatePresence } from 'framer-motion';


interface DashboardProps {
  addHistoricalData: (data: CrowdData) => void;
  historicalData: CrowdData[];
}

const ADMIN_LOG_INTERVAL = 3000; // Log data every 3 seconds for admin panel

const Dashboard: React.FC<DashboardProps> = ({ addHistoricalData, historicalData }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<VideoSource>('default');
  
  const { videoRef, startCamera, stopCamera } = useCamera();
  const { crowdData, isModelLoading, isLoadingRecommendations } = usePersonDetection(isAnalyzing, videoRef);
  const lastLogTime = useRef<number>(0);
  
  useAlerts(crowdData);

  const handleStart = () => {
    startCamera(selectedSource);
    setIsAnalyzing(true);
  };

  const handleStop = () => {
    stopCamera();
    setIsAnalyzing(false);
  };

  const a_crowdData = useRef(crowdData);
  useEffect(() => {
    a_crowdData.current = crowdData;
  }, [crowdData]);

  useEffect(() => {
    if (isAnalyzing && a_crowdData.current) {
      const currentCrowdData = a_crowdData.current;
      
      // Log data for admin panel periodically
      const now = Date.now();
      if(now - lastLogTime.current > ADMIN_LOG_INTERVAL) {
        addHistoricalData(currentCrowdData);
        lastLogTime.current = now;
      }
    }
  }, [isAnalyzing, addHistoricalData, crowdData]);
  
  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Live Monitoring Dashboard</h2>
        <div className="flex items-center gap-4">
          {isAnalyzing && (
            <>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-500 transition-all duration-300"
              >
                <StopIcon className="w-5 h-5"/>
                <span>Stop Feed</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-slate-800">
         <LiveFeed videoRef={videoRef} detections={crowdData?.detections || []} heatmapPoints={crowdData?.congestionPoints.map(p => ({ ...p, intensity: 1.0 })) || []} source={selectedSource} />
         {!isAnalyzing && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 text-center p-4">
                {isModelLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-400"></div>
                        <p className="text-slate-300 text-lg font-semibold">Loading AI Model...</p>
                        <p className="text-slate-400 text-sm max-w-sm">This may take a moment. The powerful detection model is being prepared.</p>
                    </>
                ) : (
                    <>
                        <h3 className="text-slate-300 text-lg font-semibold">Select a video source</h3>
                        <p className="text-slate-400 text-sm max-w-sm">Choose a camera or a simulated feed to begin the analysis.</p>

                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-2 w-full max-w-xs">
                          <CameraIcon className="w-5 h-5 text-slate-400" />
                          <select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value as VideoSource)}
                            className="w-full bg-transparent focus:outline-none text-white appearance-none"
                            aria-label="Select video source"
                          >
                            <option value="default" className="bg-slate-800">Default Camera</option>
                            <option value="drone1" className="bg-slate-800">Drone Feed 1 (Simulated)</option>
                            <option value="drone2" className="bg-slate-800">Drone Feed 2 (Simulated)</option>
                            <option value="external" className="bg-slate-800">External Camera (Simulated)</option>
                          </select>
                        </div>
                        
                        <button
                          onClick={handleStart}
                          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <PlayIcon className="w-5 h-5"/>
                          <span>Start Live Feed</span>
                        </button>
                    </>
                )}
            </div>
         )}
      </div>

      <div>
        <StatsPanel crowdData={crowdData} isLoadingRecommendations={isLoadingRecommendations} />
      </div>

      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-500 transition-transform transform hover:scale-110 focus:outline-none z-50"
        aria-label="Open AI Assistant"
      >
        <ChatAssistantIcon className="w-8 h-8" />
      </button>
      
      <AnimatePresence>
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
           <motion.div 
             className="fixed inset-0 bg-black/60" 
             onClick={() => setIsChatOpen(false)}
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
            />
            <motion.div 
                className="relative z-10 w-full max-w-md"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                 <ChatAssistant crowdData={crowdData} historicalData={historicalData} onClose={() => setIsChatOpen(false)} />
            </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
