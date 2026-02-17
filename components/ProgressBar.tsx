
import React from 'react';
import { AppStep } from '../types';

interface ProgressBarProps {
  currentStep: AppStep;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  const steps = [
    "Student Script",
    "Extract S.",
    "Review S.",
    "Master Key",
    "Extract M.",
    "Review M.",
    "Evaluating",
    "Report"
  ];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;
          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center flex-1 relative">
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  } ${isCurrent ? 'ring-4 ring-indigo-100 scale-110' : ''}`}
                >
                  {index + 1}
                </div>
                <span className={`text-[8px] md:text-[10px] mt-2 font-medium text-center ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mt-[-20px]">
                  <div className={`h-full transition-all duration-500 ${index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
