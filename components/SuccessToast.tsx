
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from './index';

interface SuccessToastProps {
  message: string;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ message }) => {
  return (
    <motion.div
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 p-4 bg-teal-500 text-white rounded-lg shadow-lg border border-teal-400"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      layout
    >
      <ShieldCheckIcon className="w-6 h-6 flex-shrink-0" />
      <p className="font-semibold text-sm">{message}</p>
    </motion.div>
  );
};

export default SuccessToast;