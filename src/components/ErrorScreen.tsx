import React from 'react';
import { Button } from './ui/Button';

interface ErrorScreenProps {
  error: string;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()}
          variant="primary"
        >
          Retry
        </Button>
      </div>
    </div>
  );
};

export default ErrorScreen;
