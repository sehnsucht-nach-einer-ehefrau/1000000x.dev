"use client";

import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyRequestPage() {

  return (
    <div>
      <Link href="/" className="absolute left-5 top-5">
        <Button
          variant="link"
          className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Home
        </Button>
      </Link>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white flex items-center justify-center p-8"> 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-4">
            <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Check your email</h2>
            <p className="text-gray-400">
              We&apos;ve sent a sign-in link to your email address.
            </p>
          </div>

          <div className="bg-gray-900/60 rounded-2xl p-6 border border-gray-800/50 backdrop-blur-xl">
            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                <p className="mb-2">Didn&apos;t receive the email?</p>
                <ul className="text-left space-y-1 text-xs mt-4 ml-16">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure you entered the correct email</li>
                  <li>• The link expires in 24 hours</li>
                </ul>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
