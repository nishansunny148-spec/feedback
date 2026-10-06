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
      className="w-full flex flex-col items-center justify-center p-8 text-center glass rounded-hero my-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-full bg-accent text-accent-ink flex items-center justify-center mb-6 shadow-lg shadow-accent/20"
      >
        <Check className="w-10 h-10 stroke-[2.5]" />
      </motion.div>

      <h2 className="text-3xl font-bold tracking-tight text-fg mb-2">Sent. Thank you.</h2>
      <p className="text-sm text-fg-2 max-w-xs mb-8">
        {projectName
          ? `Your feedback for ${projectName} has been recorded.`
          : 'Your feedback has been successfully submitted to the team.'}
      </p>

      <Button variant="secondary" size="md" onClick={onReset}>
        Send another note
      </Button>
    </motion.div>
  );
};
