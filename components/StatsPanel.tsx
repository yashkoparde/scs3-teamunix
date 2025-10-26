import React, { useEffect, useState } from 'react';
import { CrowdData, RiskLevel } from '../types';
import { UsersIcon, EyeIcon, AlertTriangleIcon, SparklesIcon } from './index';
// FIX: Added Variants to framer-motion import to correctly type animation variants.
import { motion, useSpring, useTransform, animate, Variants } from 'framer-motion';

interface StatsPanelProps {
  crowdData: CrowdData | null;
  isLoadingRecommendations: boolean;
}

const AnimatedNumber: React.FC<{ value: number, isFloat?: boolean }> = ({ value, isFloat }) => {
    const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => isFloat ? current.toFixed(2) : Math.round(current).toString());

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
};


const StatsCard: React.FC<{ icon: React.ReactNode; title: string; value: React.ReactNode; footer: React.ReactNode, riskLevel?: RiskLevel }> = ({ icon, title, value, footer, riskLevel }) => {
    
    const riskColorMap = {
        [RiskLevel.SAFE]: 'border-green-400',
        [RiskLevel.MODERATE]: 'border-yellow-400',
        [RiskLevel.HIGH]: 'border-red-400'
    };
    
    // FIX: Explicitly typing riskPulseVariants with Variants resolves the TypeScript error.
    const riskPulseVariants: Variants = {
        calm: { scale: 1, boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
        pulse: { 
            scale: [1, 1.02, 1],
            boxShadow: [
                "0 0 0 0px rgba(248, 113, 113, 0)",
                "0 0 0 5px rgba(248, 113, 113, 0.4)",
                "0 0 0 0px rgba(248, 113, 113, 0)",
            ],
            transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut"} 
        }
    };

    return (
    <motion.div 
        className={`bg-slate-800/50 p-5 rounded-xl flex flex-col justify-between border border-slate-700 shadow-lg h-full ${riskLevel ? riskColorMap[riskLevel] : ''}`}
        animate={riskLevel === RiskLevel.HIGH ? "pulse" : "calm"}
        variants={riskPulseVariants}
    >
      <div>
        <div className="flex items-center gap-3">
            {icon}
            <p className="text-md font-medium text-slate-300">{title}</p>
        </div>
        <p className="text-4xl font-extrabold text-white mt-3">{value}</p>
      </div>
      <div className="mt-4 text-xs text-slate-400">{footer}</div>
    </motion.div>
    )
};

const StatsPanel: React.FC<StatsPanelProps> = ({ crowdData, isLoadingRecommendations }) => {

  const getRiskDetails = () => {
    if (!crowdData) return { text: 'N/A', color: 'text-slate-400', footer: 'Inactive', level: undefined };
    switch (crowdData.riskLevel) {
      case RiskLevel.SAFE:
        return { text: 'Safe', color: 'text-green-400', footer: 'Optimal crowd flow', level: RiskLevel.SAFE };
      case RiskLevel.MODERATE:
        return { text: 'Moderate', color: 'text-yellow-400', footer: 'Monitor congestion points', level: RiskLevel.MODERATE };
      case RiskLevel.HIGH:
        return { text: 'High', color: 'text-red-400', footer: 'Action required immediately', level: RiskLevel.HIGH };
      default:
        return { text: 'N/A', color: 'text-slate-400', footer: 'Inactive', level: undefined };
    }
  };

  const riskDetails = getRiskDetails();

  return (
    <div className="space-y-4 h-full flex flex-col">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard 
                icon={<div className="p-2 rounded-lg bg-blue-500/20"><UsersIcon className="w-6 h-6 text-blue-400"/></div>}
                title="Live Headcount"
                value={<AnimatedNumber value={crowdData?.totalCount ?? 0} />}
                footer={<p>Total individuals detected in real-time.</p>}
            />
            <StatsCard 
                icon={<div className="p-2 rounded-lg bg-purple-500/20"><EyeIcon className="w-6 h-6 text-purple-400"/></div>}
                title="Density (p/m²)"
                value={<AnimatedNumber value={crowdData?.density ?? 0} isFloat />}
                footer={<p>Calculated based on a hypothetical area.</p>}
            />
            <StatsCard 
                icon={<div className={`p-2 rounded-lg bg-red-500/20`}><AlertTriangleIcon className={`w-6 h-6 ${riskDetails.color}`}/></div>}
                title="Risk Level"
                value={<span className={riskDetails.color}>{riskDetails.text}</span>}
                footer={<p>{riskDetails.footer}</p>}
                riskLevel={riskDetails.level}
            />
        </div>
        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 flex-grow">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-yellow-400"/> AI Recommendations</h3>
            {isLoadingRecommendations ? (
                <div className="text-center text-slate-400 animate-pulse">Analyzing and generating recommendations...</div>
            ) : (
                <ul className="space-y-2 text-slate-300">
                    {crowdData && crowdData.recommendations.length > 0 ? (
                        crowdData.recommendations.map((rec, index) => <li key={index} className="flex gap-2 items-start"><span className="text-teal-400 mt-1">&#8227;</span>{rec}</li>)
                    ) : (
                        <li className="list-none text-slate-500">No recommendations available. Start the feed to get AI insights.</li>
                    )}
                </ul>
            )}
        </div>
    </div>
  );
};

export default StatsPanel;