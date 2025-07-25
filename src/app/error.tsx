"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <div className="text-center max-w-lg p-8 bg-gray-900 border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-500/10 mb-6">
            <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-red-400 mb-4">An Unexpected Error Occurred</h2>
        <p className="text-gray-400 mb-8">
          We&apos;re sorry, but something went wrong on our end. Please try again, or start a new session if the problem persists.
        </p>
        <Button
          onClick={() => reset()}
          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
