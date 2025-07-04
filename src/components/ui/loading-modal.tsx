import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi, Brain, CheckCircle, AlertCircle } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  stage: 'healthCheck' | 'generating' | 'processing' | 'success' | 'error';
  wordCount: number;
  onCancel: () => void;
  error?: string;
}

export function LoadingModal({ 
  isOpen, 
  stage, 
  wordCount, 
  onCancel, 
  error 
}: LoadingModalProps) {
  const getStageInfo = () => {
    switch (stage) {
      case 'healthCheck':
        return {
          icon: <Wifi className="h-8 w-8 text-blue-500" />,
          title: 'Checking AI Service',
          description: 'Verifying connection to vocabulary generator...',
          showProgress: true
        };
      case 'generating':
        return {
          icon: <Brain className="h-8 w-8 text-purple-500" />,
          title: 'Generating Vocabulary',
          description: `Creating ${wordCount} German words with AI...`,
          showProgress: true
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-8 w-8 text-green-500 animate-spin" />,
          title: 'Processing Results',
          description: 'Organizing and validating vocabulary list...',
          showProgress: true
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Success!',
          description: 'Vocabulary list generated successfully.',
          showProgress: false
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: 'Generation Failed',
          description: error || 'An error occurred while generating vocabulary.',
          showProgress: false
        };
      default:
        return {
          icon: <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />,
          title: 'Loading...',
          description: 'Please wait...',
          showProgress: true
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">
          {stageInfo.title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {stageInfo.description}
        </DialogDescription>
        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Icon */}
          <div className="flex justify-center">
            {stageInfo.showProgress ? (
              <div className="relative">
                {stageInfo.icon}
                {stage === 'healthCheck' && (
                  <div className="absolute -inset-2 border-2 border-blue-200 rounded-full animate-pulse" />
                )}
                {stage === 'generating' && (
                  <div className="absolute -inset-2 border-2 border-purple-200 rounded-full animate-pulse" />
                )}
              </div>
            ) : (
              stageInfo.icon
            )}
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-center">
            {stageInfo.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-600 text-center max-w-sm">
            {stageInfo.description}
          </p>

          {/* Loading Animation */}
          {stageInfo.showProgress && (
            <div className="w-full max-w-xs">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {stage === 'error' && (
              <Button onClick={onCancel} variant="default">
                Try Again
              </Button>
            )}
            {stageInfo.showProgress && (
              <Button onClick={onCancel} variant="outline">
                Cancel
              </Button>
            )}
            {stage === 'success' && (
              <Button onClick={onCancel} variant="default">
                Continue
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 