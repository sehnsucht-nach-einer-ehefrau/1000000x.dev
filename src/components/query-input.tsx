"use client"

import type React from "react"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { type LucideIcon, Search, Sparkles, Rocket, Zap, Brain, Code, Database, Globe, Cog, Network, Clock, Layers, Cloud, Radar, Wrench, Shield, Lock } from "lucide-react"

const allSuggestions = [
    { text: "React Server Components", icon: Code }, { text: "Kubernetes Architecture", icon: Database }, { text: "GraphQL Federation", icon: Globe }, { text: "Rust Memory Management", icon: Brain }, { text: "PostgreSQL Indexing", icon: Database }, { text: "Docker Networking", icon: Globe }, { text: "WebAssembly Performance", icon: Rocket }, { text: "TypeScript Type Inference", icon: Code }, { text: "Linux Kernel Internals", icon: Cog }, { text: "Distributed Systems", icon: Network }, { text: "Zero-Knowledge Proofs", icon: Lock }, { text: "Event Sourcing Patterns", icon: Clock }, { text: "Edge Computing", icon: Globe }, { text: "Rust Ownership Model", icon: Brain }, { text: "gRPC Communication", icon: Network }, { text: "OAuth 2.0 Flow", icon: Lock }, { text: "Machine Learning Pipelines", icon: Brain }, { text: "Redis Caching Strategies", icon: Database }, { text: "Terraform Modules", icon: Layers }, { text: "Serverless Architecture", icon: Cloud }, { text: "Python Data Classes", icon: Code }, { text: "OpenTelemetry Tracing", icon: Radar }, { text: "CI/CD Automation", icon: Wrench }, { text: "Next.js Routing", icon: Code }, { text: "BGP Routing Protocol", icon: Network }, { text: "API Rate Limiting", icon: Shield }, { text: "Kafka Stream Processing", icon: Network }, { text: "LLVM Intermediate Representation", icon: Code }, { text: "Cloudflare Workers", icon: Globe }, { text: "CAP Theorem", icon: Brain }, { text: "Elixir Concurrency Model", icon: Code }, { text: "Istio Service Mesh", icon: Layers }, { text: "JWT Authentication", icon: Lock }, { text: "NVMe over Fabrics", icon: Database }, { text: "Ansible Playbooks", icon: Wrench }, { text: "CRDTs for Collaboration", icon: Network }, { text: "FaaS Design Patterns", icon: Cloud }, { text: "ZooKeeper Coordination", icon: Cog }, { text: "gdb Debugging Techniques", icon: Code }, { text: "Prometheus Alerting Rules", icon: Radar }, { text: "NATS Messaging", icon: Network }, { text: "S3 Bucket Security", icon: Shield }, { text: "React Suspense", icon: Code }, { text: "CSP Headers", icon: Lock }, { text: "Varnish Caching", icon: Database }, { text: "Binary Protocol Design", icon: Cog }, { text: "eBPF Observability", icon: Radar }, { text: "Rust Lifetimes", icon: Brain }, { text: "Load Balancer Algorithms", icon: Network }, { text: "Helm Chart Templates", icon: Layers }, { text: "SQL Query Optimization", icon: Database }, { text: "TLS Handshake", icon: Lock }, { text: "React Concurrent Mode", icon: Code }, { text: "DNS Resolution Flow", icon: Globe }, { text: "Consul Service Discovery", icon: Network }, { text: "Cgroup Resource Limits", icon: Cog }, { text: "Python Asyncio", icon: Code }, { text: "WebSockets Protocol", icon: Globe }, { text: "SAML SSO Integration", icon: Shield }, { text: "Neovim Lua Config", icon: Code }, { text: "Zig Memory Safety", icon: Brain }, { text: "OpenAPI Specification", icon: Code }, { text: "Vertical vs Horizontal Scaling", icon: Cloud }, { text: "Filesystem Inodes", icon: Cog }, { text: "Cloud NAT Gateways", icon: Globe }, { text: "CI Metrics Dashboards", icon: Radar },
  ]

interface QueryInputProps {
  onSubmit: (query: string) => void
  isLoading: boolean
}

export default function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<{ text: string; icon: LucideIcon }[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      onSubmit(query.trim())
    }
  }


  useEffect(() => {
    const picked = new Set<number>()
    const result: { text: string; icon: LucideIcon }[] = []
    while (result.length < 6) {
      const num = Math.floor(Math.random() * allSuggestions.length)
      if (picked.has(num)) continue
      picked.add(num)
      result.push(allSuggestions[num])
    }
    setSuggestions(result)
  }, [])

  return (
    <motion.div
      className="space-y-8"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="relative flex justify-center">
        {/* ADD data-magnetic-target TO THE MAIN WRAPPER */}
        <div className="relative group min-w-4xl" data-magnetic-target>
          <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 group-focus-within:opacity-40 transition duration-500"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/50 to-purple-600/50 rounded-3xl blur opacity-25 group-hover:opacity-40 group-focus-within:opacity-50 transition duration-300"></div>

          <div className="relative flex items-center bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden">
            <div className="relative flex-1">
              <motion.div
                className="absolute left-8 top-1/2 -translate-y-1/2"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Search className="h-7 w-7 text-gray-400 group-focus-within:text-violet-400 transition-colors duration-300" />
              </motion.div>
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter any technical topic to master... (e.g., React Hooks, Microservices, Machine Learning)"
                className="w-full h-20 pl-20 pr-8 py-6 bg-transparent border-none text-xl text-white placeholder-gray-400 focus:ring-0 focus:outline-none font-medium"
                disabled={isLoading}
              />
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {/* ADD data-magnetic-target TO THE BUTTON */}
              <Button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="m-3 h-14 px-10 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                data-magnetic-target 
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                {isLoading ? (
                  <div className="flex items-center relative z-10">
                    <motion.div
                      className="h-6 w-6 border-2 border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                    <span className="text-lg">Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center relative z-10">
                    <Rocket size={24} className="mr-3" />
                    <span className="text-lg">Explore</span>
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <Sparkles size={20} className="ml-3 opacity-80" />
                    </motion.div>
                  </div>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </form>

      {!isLoading && (
        <motion.div
          className="text-center"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-500/50"></div>
            <p className="text-lg text-gray-400 font-medium flex items-center space-x-2">
              <Zap className="h-5 w-5 text-violet-400" />
              <span>Popular topics to explore</span>
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-500/50"></div>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-auto">
              {suggestions.map((suggestion) => {
                const IconComponent = suggestion.icon
                return (
                  // ADD data-magnetic-target TO EACH SUGGESTION BUTTON
                  <motion.button
                    key={suggestion.text}
                    onClick={() => setQuery(suggestion.text)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative overflow-hidden p-6 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 hover:border-gray-600/50 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl hover:shadow-xl hover:shadow-violet-500/10"
                    data-magnetic-target 
                  >
                    <span className="pointer-events-none absolute inset-0 z-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-violet-500/10 to-transparent transition-transform duration-1000 ease-out"/>
                    <div className="relative z-10 flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-6 w-6 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg group-hover:text-violet-200 transition-colors">
                          {suggestion.text}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">Click to explore</p>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
