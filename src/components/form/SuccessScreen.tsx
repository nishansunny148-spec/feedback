import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/Button';

export interface SuccessScreenProps {
  onReset: () => void;
  projectName?: string | null;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ onReset, projectName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: '#FAFAFA',
        border: '1px solid #D9D9D9',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}
      className="w-full flex flex-col items-center justify-center p-8 text-center rounded-hero my-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-full bg-[#C6FF3D] text-[#0A0A0A] border border-[#0A0A0A] flex items-center justify-center mb-6"
      >
        <Check className="w-10 h-10 stroke-[2.5]" />
      </motion.div>

      <h2 className="text-3xl font-bold tracking-tight text-[#0A0A0A] mb-2">Sent. Thank you.</h2>
      <p className="text-sm text-[#3F3F3F] max-w-xs mb-8">
        {projectName
          ? `Your feedback for ${projectName} has been recorded.`
          : 'Your feedback has been successfully submitted to the team.'}
      </p>

      <Button
        variant="secondary"
        size="md"
        onClick={onReset}
        className="!bg-white !text-[#0A0A0A] !border !border-[#0A0A0A] hover:!bg-neutral-50"
      >
        Send another note
      </Button>
    </motion.div>
  );
};
