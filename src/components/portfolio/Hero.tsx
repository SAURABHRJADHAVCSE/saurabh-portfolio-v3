"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, Zap } from "lucide-react";

const statusItems = [
  { label: "Open to Work", color: "bg-[#FFEB3B]" },
  { label: "Building cool stuff", color: "bg-[#2196F3] text-white" },
];

export default function Hero() {
  return (
    <section className="min-h-screen border-b-4 border-black bg-[#FFEB3B] relative overflow-hidden flex flex-col justify-center px-6 md:px-16 py-20">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #000 0, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 40px)",
        }}
      />

      {/* Floating decorative blocks */}
      <motion.div
        className="absolute top-10 right-10 w-24 h-24 bg-[#F44336] border-4 border-black"
        style={{ boxShadow: "8px 8px 0 #000" }}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-32 w-16 h-16 bg-[#2196F3] border-4 border-black"
        style={{ boxShadow: "8px 8px 0 #000" }}
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 right-8 w-10 h-10 bg-black"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        {/* Status badges */}
        <motion.div
          className="flex flex-wrap gap-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {statusItems.map((item) => (
            <span
              key={item.label}
              className={`${item.color} border-4 border-black px-4 py-1.5 text-sm font-bold uppercase tracking-widest inline-flex items-center gap-2`}
              style={{ boxShadow: "4px 4px 0 #000" }}
            >
              <Zap size={14} strokeWidth={3} />
              {item.label}
            </span>
          ))}
          <motion.span
            className="bg-black text-[#FFEB3B] border-4 border-black px-4 py-1.5 text-sm font-bold uppercase tracking-widest"
            style={{ boxShadow: "4px 4px 0 #F44336" }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ● Available
          </motion.span>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <h1
            className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.9] tracking-tighter text-black uppercase"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Saurabh
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">Dev.</span>
              <span
                className="absolute inset-0 bg-[#2196F3] -z-0 translate-x-2 translate-y-2"
                aria-hidden
              />
            </span>
          </h1>
        </motion.div>

        <motion.p
          className="mt-6 text-xl md:text-2xl font-bold text-black max-w-2xl"
          style={{ fontFamily: "var(--font-caveat)", fontSize: "clamp(1.25rem,3vw,1.75rem)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Full-Stack Engineer crafting fast, accessible, and brutally honest web
          experiences. I turn ideas into production-grade software.
        </motion.p>

        {/* CTA row */}
        <motion.div
          className="mt-10 flex flex-wrap gap-4 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <a
            href="#projects"
            className="bg-black text-[#FFEB3B] border-4 border-black px-8 py-4 font-black uppercase text-lg tracking-wider inline-flex items-center gap-2 hover:bg-[#F44336] hover:text-white transition-colors"
            style={{ boxShadow: "8px 8px 0 #F44336" }}
          >
            View Work <ArrowDownRight size={22} strokeWidth={3} />
          </a>
          <a
            href="#contact"
            className="bg-white text-black border-4 border-black px-8 py-4 font-black uppercase text-lg tracking-wider hover:bg-[#2196F3] hover:text-white transition-colors"
            style={{ boxShadow: "8px 8px 0 #000" }}
          >
            Say Hello
          </a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-6 md:left-16 flex items-center gap-3"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-4 border-black rounded-full flex items-start justify-center pt-1">
            <div className="w-1.5 h-2 bg-black rounded-full" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Scroll</span>
        </motion.div>
      </div>
    </section>
  );
}
