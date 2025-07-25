"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { KeyRound, Star, Loader2 } from 'lucide-react';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySubmit: (apiKey: string) => Promise<void>;
}

export default function ApiKeyDialog({ isOpen, onClose, onApiKeySubmit }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);


  const fetchApiKey = useCallback(async () => {
    if (!isOpen) return;
    setIsFetching(true);
    try {
      const response = await fetch('/api/user/api-key');
      if (response.ok) {
        const data = await response.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error);
    } finally {
      setIsFetching(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchApiKey();
  }, [fetchApiKey]);



  const handleSubmit = async () => {
    if (!apiKey.trim()) return;
    setIsLoading(true);
    try {
      await onApiKeySubmit(apiKey.trim());
      onClose(); // Close dialog on successful submission
    } catch (error) {
      console.error('Failed to submit API key', error);
      // Here you could add a toast notification for the error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] bg-black/80 backdrop-blur-xl border-gray-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">API Key Configuration</DialogTitle>
          <DialogDescription>
            Manage your Groq API key or subscribe to our managed service.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="border border-gray-700/80 p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-3 mb-3">
              <KeyRound className="w-6 h-6 text-violet-400" />
              <h3 className="text-lg font-semibold">Use Your Own Groq API Key</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">This is a free option if you have your own Groq API key.</p>
            <div className="flex gap-2 items-center">
              <Input
                type="password"
                placeholder={isFetching ? "Loading key..." : "Enter your Groq API key..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading || isFetching}
                className="bg-black/50 border-gray-600 focus-visible:ring-violet-500"
              />
              <Button onClick={handleSubmit} disabled={isLoading || isFetching || !apiKey.trim()}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Saving...' : 'Save Key'}
              </Button>
            </div>
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="instructions" className="border-b-0">
                <AccordionTrigger className="text-sm hover:no-underline">How to get your Groq API Key</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Go to <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-violet-400">GroqCloud API Keys</a>.</li>
                    <li>Sign up or log in to your account.</li>
                    <li>Click the &apos;Create API Key&apos; button.</li>
                    <li>Name your key, then copy and paste it here.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="border border-dashed border-gray-700 p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Use Our Managed Service (Premium)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">For a hassle-free experience without managing your own keys, our premium plan is coming soon.</p>
            <Button disabled className="bg-gray-600">
              Coming Soon
            </Button>
          </div>
        </div>
        <DialogFooter>
            <p className="text-xs text-muted-foreground mr-auto">Your API key is stored securely in our database.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
