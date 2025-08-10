"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';

interface FeedbackModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !message) return;

		setStatus('sending');
		try {
			const response = await fetch('/api/send-feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, message }),
			});

			if (!response.ok) {
				throw new Error('Failed to send feedback');
			}
			setStatus('success');
			setTimeout(() => {
				onClose();
				setTimeout(() => setStatus('idle'), 500); // Reset after closing
			}, 2000);
		} catch (error) {
			console.error('Feedback error:', error);
			setStatus('error');
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ type: "spring", stiffness: 300, damping: 25 }}
						className="bg-gray-900 border border-gray-700/50 rounded-2xl p-8 w-full max-w-md shadow-2xl relative"
						onClick={(e) => e.stopPropagation()}
					>
						<Button variant="ghost" size="icon" className="absolute top-4 right-4 text-gray-500 hover:text-white" onClick={onClose}>
							<X />
						</Button>

						{status === 'success' ? (
							<div className="text-center py-8">
								<CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
								<h3 className="text-2xl font-bold text-white">Thank You!</h3>
								<p className="text-gray-400 mt-2">Your feedback has been sent successfully.</p>
							</div>
						) : (
							<>
								<h3 className="text-2xl font-bold text-white mb-2">Share Your Feedback</h3>
								<p className="text-gray-400 mb-6">We&apos;d love to hear your thoughts on how we can improve.</p>
								<form onSubmit={handleSubmit} className="space-y-4">
									<Input type="email" placeholder="Your Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-gray-800 border-gray-700" />
									<Textarea placeholder="Your message..." value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} className="bg-gray-800 border-gray-700" />
									{status === 'error' && <p className="text-sm text-red-400">Something went wrong. Please try again.</p>}
									<Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold" disabled={status === 'sending'}>
										{status === 'sending' ? <Loader2 className="animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send Feedback</>}
									</Button>
								</form>
							</>
						)}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
