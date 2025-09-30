import React from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Loading recreation data..." />
      </div>
    </div>
  );
};

export default LoadingScreen;
