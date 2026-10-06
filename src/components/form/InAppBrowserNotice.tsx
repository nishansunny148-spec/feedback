import { Check, Copy, ExternalLink } from 'lucide-react';
import React, { useState } from 'react';
import { copyText } from '../../lib/clipboard';
import { Button } from '../ui/Button';

export interface InAppBrowserNoticeProps {
  appName: string;
}

export const InAppBrowserNotice: React.FC<InAppBrowserNoticeProps> = ({ appName }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    const ok = await copyText(window.location.href);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full p-4 bg-warning/10 border border-warning/20 rounded-card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0 mt-0.5">
          <ExternalLink className="w-4 h-4" />
        </div>
        <div className="flex-1 text-sm">
          <h4 className="font-semibold text-fg">You are viewing in {appName}</h4>
          <p className="text-xs text-fg-2 mt-0.5">
            In-app browsers can restrict microphone access. For the best experience, tap the <strong>•••</strong> menu at the top right and select <strong>Open in Chrome / Safari</strong>.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          icon={copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
        >
          {copied ? 'Link copied' : 'Copy link'}
        </Button>
      </div>
    </div>
  );
};
