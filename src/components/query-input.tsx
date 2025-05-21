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
    }
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative flex items-center transition-all duration-300 ${
            isFocused ? "ring-2 ring-blue-500/50" : ""
          }`}
        >
          <div className="absolute left-3 flex items-center justify-center h-10 w-10 rounded-full bg-gray-800/80">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Enter a topic to explore the rabbit hole..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-16 pr-32 py-6 bg-gray-900/80 backdrop-blur-sm border-gray-800 text-white rounded-full shadow-lg"
            disabled={isLoading}
          />
          <div className="absolute right-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-4 shadow-lg shadow-blue-700/20"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
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
