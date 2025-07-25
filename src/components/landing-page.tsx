
"use client"

import { motion } from "framer-motion"
import { Brain, Search, MessageCircle, GitBranch, Network, Eye, BookOpen, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import QueryInput from "./query-input"
import { useEffect, useState } from "react"

interface LandingPageProps {
  onSubmit: (query: string) => void
}

export default function LandingPage({ onSubmit }: LandingPageProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: 999999,
        ease: "easeInOut",
      },
    },
  }

  const features = [
    {
      icon: Search,
      title: "Deep Subject Research",
      description: "Get comprehensive, AI-generated insights on any topic instantly",
    },
    {
      icon: MessageCircle,
      title: "Interactive Q&A",
      description: "Ask follow-up questions and dive deeper into specific aspects",
    },
    {
      icon: GitBranch,
      title: "Generate Rabbit Holes",
      description: "Discover related topics and tangential subjects to explore",
    },
    {
      icon: Network,
      title: "Knowledge Graph View",
      description: "Visualize connections between topics in an interactive graph",
    },
    {
      icon: Eye,
      title: "Dual View Modes",
      description: "Switch between chat and graph views to see your exploration journey",
    },
    {
      icon: BookOpen,
      title: "Comprehensive Learning",
      description: "Build a complete understanding through interconnected knowledge",
    },
  ]

  const stats = [
    { number: "∞", label: "Topics to Explore" },
    { number: "100%", label: "Comprehensive" },
    { number: "$0", label: "To Use" },
    { number: "∞", label: "Rabbit Holes" },
  ]

  const howItWorks = [
    {
      step: "1",
      title: "Search Any Subject",
      description: "Start with any topic that interests you",
      icon: Search,
    },
    {
      step: "2",
      title: "Get Deep Insights",
      description: "Receive comprehensive AI-generated information",
      icon: Brain,
    },
    {
      step: "3",
      title: "Ask Questions",
      description: "Dive deeper with follow-up questions",
      icon: MessageCircle,
    },
    {
      step: "4",
      title: "Explore Connections",
      description: "Generate and explore related rabbit holes",
      icon: GitBranch,
    },
    {
      step: "5",
      title: "Visualize Knowledge",
      description: "See your learning journey in graph view",
      icon: Network,
    },
  ]

  const testimonials = [
    {
      quote:
        "I went from knowing nothing about quantum physics to understanding complex concepts in hours. The rabbit holes led me through fascinating connections I never would have found.",
      author: "Dr. Sarah Chen",
      role: "Research Scientist",
    },
    {
      quote:
        "This completely changed how I learn. Being able to see how topics connect visually makes everything click. It's like having a personal research assistant.",
      author: "Marcus Rodriguez",
      role: "Graduate Student",
    },
    {
      quote:
        "The graph view is incredible. I can see my entire learning journey and how different concepts relate. It's like mapping my own curiosity.",
      author: "Emily Watson",
      role: "Lifelong Learner",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white overflow-hidden antialiased relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-3/4 left-1/3 w-64 h-64 bg-pink-500/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "3s" }}
        />

      {/* Network-like connecting lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[...Array(8)].map((_, i) => {
          const x1 = (i * 150) % windowSize.width || 0
          const y1 = (i * 100) % windowSize.height || 0
          const x2 = ((i + 1) * 200) % windowSize.width || 0
          const y2 = ((i + 2) * 150) % windowSize.height || 0

          return (
            <motion.line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 2, delay: i * 0.2, repeat: 999999, repeatType: "reverse" }}
            />
          )
        })}
      </svg>

      {/* Knowledge nodes */}
      {[...Array(12)].map((_, i) => {
        const leftPos = (i * 37) % 100
        const topPos = (i * 23 + 17) % 100
        const size = 2 + (i % 3)

        return (
          <motion.div
            key={i}
            className={`absolute w-${size} h-${size} bg-violet-400/20 rounded-full border border-violet-400/30`}
            style={{
              left: `${leftPos}%`,
              top: `${topPos}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: 999999,
              delay: (i % 4) * 0.5,
              ease: "easeInOut",
            }}
          />
        )
      })}
    </div>

    {/* Header */}
    <motion.header
      className="p-6 relative z-20"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-xl ring-2 ring-purple-500/30">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: 999999, ease: "linear" }}>
                <Brain className="h-6 w-6 text-white" />
              </motion.div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
              1,000,000x.dev
            </h1>
            <p className="text-lg text-gray-400">&quot;The perfect tool for deep research and brainstorming.&quot;</p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <Badge variant="secondary" className="bg-violet-500/10 text-violet-300 border-violet-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Beta Access
          </Badge>
        </div>
      </div>
    </motion.header>

    <div className="relative z-10">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
        <div className="max-w-6xl mx-auto w-full space-y-12">
          <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
            <motion.div className="flex justify-center mb-8" variants={floatingVariants} animate="animate">
              <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl ring-4 ring-purple-500/20">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: 999999, ease: "linear" }}>
                    <Brain className="h-12 w-12 text-white" />
                  </motion.div>
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur opacity-20 animate-pulse" />
              </div>
            </motion.div>

            <motion.h2
              className="text-6xl sm:text-7xl lg:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 leading-tight"
              variants={itemVariants}
            >
              F*ck 10x.
              <br />
              <span className="text-5xl sm:text-6xl lg:text-7xl">Become 1,000,000x.</span>
            </motion.h2>

            <motion.p
              className="text-gray-300 text-2xl sm:text-3xl leading-relaxed font-light max-w-4xl mx-auto"
              variants={itemVariants}
            >
              Become a <span className="text-violet-400 font-semibold">King of all trades</span>.
              <br />
              Master every skill. Solve any problem. Know everything.
            </motion.p>

            <motion.div className="flex flex-wrap justify-center gap-4 mt-8" variants={itemVariants}>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 px-4 py-2 text-sm">
                <Search className="w-4 h-4 mr-2" />
                Deep Research
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-2 text-sm">
                <GitBranch className="w-4 h-4 mr-2" />
                Rabbit Holes
              </Badge>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-4 py-2 text-sm">
                <Network className="w-4 h-4 mr-2" />
                Graph View
              </Badge>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            className="text-center mb-16"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h3
              className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400 mb-6"
              variants={itemVariants}
            >
              How It Works
            </motion.h3>
            <motion.p className="text-gray-300 text-xl max-w-3xl mx-auto" variants={itemVariants}>
              Your curiosity-driven learning journey in 5 simple steps.
            </motion.p>
          </motion.div>

          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-start md:items-center justify-center gap-8"
          >
            {howItWorks.map((step, index) => (
              <div key={index}>
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col items-center text-center w-full md:w-auto"
                >
                  <div className="relative mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30">
                      <step.icon className="h-8 w-8 text-violet-400" />
                    </div>
                    <span className="absolute -top-2 -right-2 h-8 w-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </span>
                  </div>

                  <h4 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h4>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                  </motion.div>
                </div>
              ))}
            </motion.section>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-8">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {stats.map((stat, index) => (
                <motion.div key={index} className="text-center" variants={itemVariants}>
                  <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-8">
            <motion.div
              className="text-center mb-16"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.h3
                className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400 mb-6"
                variants={itemVariants}
              >
                Powerful Features
              </motion.h3>
              <motion.p className="text-gray-300 text-xl max-w-3xl mx-auto" variants={itemVariants}>
                Everything you need to explore knowledge and make connections.
              </motion.p>
            </motion.div>

<motion.div
  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  {features.map((feature, index) => (
    <motion.div
      key={index}
      variants={itemVariants}
      className="overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 backdrop-blur-sm hover:border-violet-500/30 hover:bg-violet-900/30 transition-colors duration-300 "
    >
      {/* Card content (now simplified) */}
      <div className="flex items-center mb-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center transition-colors duration-300">
          <feature.icon className="h-6 w-6 text-violet-400" />
        </div>
      </div>

      <h4 className="text-xl font-semibold text-white mb-3">
        {feature.title}
      </h4>
      <p className="text-gray-400 leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  ))}
</motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-8">
            <motion.div
              className="text-center mb-16"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.h3
                className="py-1 text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400 mb-6"
                variants={itemVariants}
              >
                Learning Transformed
              </motion.h3>
              <motion.p className="text-gray-300 text-xl max-w-3xl mx-auto" variants={itemVariants}>
                See how others are exploring knowledge in revolutionary ways.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="p-8 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 backdrop-blur-sm"
                  variants={itemVariants}
                >
                  <div className="flex mb-4">
                    <Network className="h-6 w-6 text-violet-400" />
                  </div>
                  <p className="text-gray-300 mb-6 italic leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                  <div>
                    <div className="font-semibold text-white">{testimonial.author}</div>
                    <div className="text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.h3
                className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400 mb-6"
                variants={itemVariants}
              >
                Start Your Journey
              </motion.h3>
              <motion.p className="text-gray-300 text-xl mb-12 max-w-2xl mx-auto" variants={itemVariants}>
                What will you explore first? Every search opens infinite possibilities.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Input Section - At the bottom */}
        <section className="pb-20 relative">
          <div className="max-w-4xl mx-auto px-8">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <QueryInput onSubmit={onSubmit} isLoading={false} />
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}
