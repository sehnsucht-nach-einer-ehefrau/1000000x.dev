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
		// You can log the error to an error reporting service here
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
			<div className="bg-gray-900/50 border border-red-500/30 rounded-lg p-8 max-w-md w-full text-center backdrop-blur-md">
				<AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
				<h2 className="text-2xl font-bold mb-2">Oops, something went wrong!</h2>
				<p className="text-gray-400 mb-6">We encountered an unexpected error. Please try again.</p>
				<Button
					onClick={() => reset()}
					className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
				>
					Try Again
				</Button>
			</div>
		</div>
	);
}
