"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export default function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      // Optional: setQuery(""); // Clear input after submission
    }
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative flex items-center transition-all duration-300 rounded-full
            ${
              isFocused
                ? "ring-2 ring-blue-500/70 shadow-lg shadow-blue-500/30"
                : "ring-1 ring-gray-700/50"
            }`}
        >
          <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Enter a topic to explore..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full pl-12 pr-36 py-6 bg-gray-900/80 backdrop-blur-sm border-transparent focus:border-transparent focus:ring-0 text-white rounded-full text-base"
            disabled={isLoading}
            aria-label="Topic input"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-5 py-2.5 shadow-md hover:shadow-lg transition-shadow"
              aria-label="Explore topic"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2.5"></div>
                  <span>Exploring...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span>Explore</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
