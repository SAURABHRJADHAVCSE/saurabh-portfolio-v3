"use client";

import { motion } from "framer-motion";
import { Briefcase, GraduationCap } from "lucide-react";

type TimelineItem = {
  type: "work" | "education";
  role: string;
  org: string;
  period: string;
  location: string;
  description: string;
  tags: string[];
  color: string;
  accent: string;
};

const timeline: TimelineItem[] = [
  {
    type: "work",
    role: "Senior Full-Stack Engineer",
    org: "TechCorp Inc.",
    period: "2023 – Present",
    location: "Remote",
    description:
      "Leading the frontend architecture for a B2B SaaS platform serving 50k+ users. Migrated from CRA to Next.js 16, reducing LCP by 62%. Built the company's AI feature layer.",
    tags: ["Next.js", "React 19", "TypeScript", "Firebase", "AI"],
    color: "#FFEB3B",
    accent: "#F44336",
  },
  {
    type: "work",
    role: "Full-Stack Developer",
    org: "Startup Labs",
    period: "2021 – 2023",
    location: "Hybrid · Mumbai",
    description:
      "Built 3 MVPs from zero-to-launch. Owned the full stack — Next.js frontend, Node.js API, PostgreSQL + Redis data layer. Shipped in 6-week cycles.",
    tags: ["React", "Node.js", "PostgreSQL", "Redis", "Docker"],
    color: "#2196F3",
    accent: "#FFEB3B",
  },
  {
    type: "work",
    role: "Frontend Engineer",
    org: "Pixel Agency",
    period: "2020 – 2021",
    location: "On-site · Pune",
    description:
      "Developed responsive web apps for 20+ clients. Specialised in animations, accessibility, and performance. First exposure to component library architecture.",
    tags: ["React", "GSAP", "Tailwind CSS", "Figma"],
    color: "#F44336",
    accent: "#2196F3",
  },
  {
    type: "education",
    role: "B.E. Computer Engineering",
    org: "University of Pune",
    period: "2016 – 2020",
    location: "Pune, India",
    description:
      "Graduated with First Class Distinction. Core focus on data structures, algorithms, and distributed systems. Built a real-time collaborative editor for final year project.",
    tags: ["C++", "Java", "DBMS", "OS", "Computer Networks"],
    color: "#FFEB3B",
    accent: "#000",
  },
];

export default function Experience() {
  return (
    <section id="experience" className="py-20 px-6 md:px-16 bg-[#F44336] border-b-4 border-black">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="text-xs font-black uppercase tracking-[0.3em] bg-[#FFEB3B] text-black border-4 border-black px-3 py-1 inline-block mb-4"
            style={{ boxShadow: "4px 4px 0 #000" }}
          >
            My Journey
          </span>
          <h2
            className="text-5xl md:text-7xl font-black uppercase leading-none text-white"
            style={{ fontFamily: "var(--font-space-grotesk)", textShadow: "4px 4px 0 #000" }}
          >
            Experience
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 md:left-7 top-0 bottom-0 w-1 bg-black" />

          <div className="space-y-8 pl-14 md:pl-20">
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div
                  className="absolute -left-14 md:-left-20 top-5 w-10 h-10 md:w-14 md:h-14 border-4 border-black flex items-center justify-center z-10"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: "4px 4px 0 #000",
                  }}
                >
                  {item.type === "work" ? (
                    <Briefcase size={18} strokeWidth={3} className="text-black" />
                  ) : (
                    <GraduationCap size={18} strokeWidth={3} className="text-black" />
                  )}
                </div>

                {/* Card */}
                <motion.div
                  whileHover={{ x: 6, y: -4 }}
                  className="border-4 border-black bg-white"
                  style={{
                    boxShadow: "8px 8px 0 #000",
                    transition: "box-shadow 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `12px 12px 0 ${item.accent === "#000" ? "#FFEB3B" : item.accent}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "8px 8px 0 #000";
                  }}
                >
                  {/* Card header bar */}
                  <div
                    className="p-4 border-b-4 border-black flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    style={{ backgroundColor: item.color }}
                  >
                    <div className="flex-1">
                      <h3
                        className="text-xl md:text-2xl font-black uppercase text-black leading-tight"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {item.role}
                      </h3>
                      <p className="text-sm font-black text-black/70 uppercase tracking-wider">
                        {item.org} · {item.location}
                      </p>
                    </div>
                    <span
                      className="text-xs font-black uppercase border-4 border-black px-3 py-1.5 whitespace-nowrap self-start sm:self-auto"
                      style={{
                        backgroundColor: item.accent === "#000" ? "#000" : item.accent,
                        color: item.accent === "#000" || item.accent === "#2196F3" ? "#fff" : "#000",
                        boxShadow: "3px 3px 0 #000",
                      }}
                    >
                      {item.period}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <p
                      className="text-base font-bold text-black/80 leading-relaxed mb-4"
                      style={{ fontFamily: "var(--font-caveat)", fontSize: "1.1rem" }}
                    >
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-black uppercase border-2 border-black px-2.5 py-1 bg-black text-white"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <motion.div
          className="mt-16 border-4 border-black bg-black p-8 flex flex-col sm:flex-row items-center gap-6"
          style={{ boxShadow: "8px 8px 0 #FFEB3B" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex-1">
            <h3
              className="text-2xl font-black text-[#FFEB3B] uppercase"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Let&apos;s build something together.
            </h3>
            <p
              className="text-white/70 font-bold mt-1"
              style={{ fontFamily: "var(--font-caveat)", fontSize: "1.15rem" }}
            >
              Open to full-time roles, freelance, and collaborations
            </p>
          </div>
          <a
            href="mailto:hello@saurabh.dev"
            id="contact"
            className="bg-[#FFEB3B] text-black border-4 border-[#FFEB3B] px-8 py-4 font-black uppercase text-lg whitespace-nowrap hover:bg-white transition-colors"
            style={{ boxShadow: "6px 6px 0 #F44336" }}
          >
            Get In Touch →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
