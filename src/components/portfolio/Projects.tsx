"use client";

import { motion } from "framer-motion";
import { ExternalLink, Github, ArrowUpRight } from "lucide-react";

const projects = [
  {
    id: "01",
    title: "NexusAI Platform",
    description:
      "Multi-provider AI platform with real-time streaming, rate limiting, circuit breaker, and a provider-agnostic interface. Handles 10k+ req/day.",
    tags: ["Next.js 16", "TypeScript", "Gemini", "Firebase", "Upstash"],
    color: "#FFEB3B",
    accent: "#F44336",
    link: "#",
    github: "#",
    status: "Live",
  },
  {
    id: "02",
    title: "AuthKit Pro",
    description:
      "Full-stack authentication system with OAuth, magic links, session cookies, and server-side protection. Zero client-side secrets.",
    tags: ["Firebase Auth", "Next.js", "Zod", "React Hook Form"],
    color: "#2196F3",
    accent: "#FFEB3B",
    link: "#",
    github: "#",
    status: "Open Source",
  },
  {
    id: "03",
    title: "DevDash",
    description:
      "Developer productivity dashboard with CI/CD monitoring, Jira integration, GitHub stats, and real-time alerts. Built for engineering teams.",
    tags: ["React 19", "Tailwind v4", "WebSocket", "PostgreSQL"],
    color: "#F44336",
    accent: "#2196F3",
    link: "#",
    github: "#",
    status: "Beta",
  },
  {
    id: "04",
    title: "Brutalist CMS",
    description:
      "Headless CMS with a visual drag-and-drop editor, content versioning, i18n support, and edge-cached delivery.",
    tags: ["SvelteKit", "PocketBase", "Cloudflare Workers", "Tiptap"],
    color: "#FFEB3B",
    accent: "#2196F3",
    link: "#",
    github: "#",
    status: "WIP",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

export default function Projects() {
  return (
    <section id="projects" className="py-20 px-6 md:px-16 bg-white border-b-4 border-black">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          className="mb-14 flex flex-col sm:flex-row sm:items-end gap-4"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <span
              className="text-xs font-black uppercase tracking-[0.3em] bg-[#F44336] text-white border-4 border-black px-3 py-1 inline-block mb-4"
              style={{ boxShadow: "4px 4px 0 #000" }}
            >
              Selected Work
            </span>
            <h2
              className="text-5xl md:text-7xl font-black uppercase leading-none text-black"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Projects
            </h2>
          </div>
          <div className="sm:ml-auto sm:mb-2">
            <p
              className="text-lg font-bold text-black/60 max-w-xs"
              style={{ fontFamily: "var(--font-caveat)", fontSize: "1.25rem" }}
            >
              Things I&apos;ve built and shipped →
            </p>
          </div>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={cardVariants}
              whileHover={{ y: -6, x: -6 }}
              className="group border-4 border-black relative"
              style={{
                backgroundColor: project.color,
                boxShadow: `8px 8px 0 #000`,
                transition: "box-shadow 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "14px 14px 0 #000";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "8px 8px 0 #000";
              }}
            >
              {/* Card number + status */}
              <div className="flex items-center justify-between p-4 border-b-4 border-black">
                <span
                  className="text-4xl font-black text-black/20"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {project.id}
                </span>
                <span
                  className="text-xs font-black uppercase tracking-widest border-4 border-black px-3 py-1"
                  style={{
                    backgroundColor: project.accent,
                    color: project.accent === "#FFEB3B" ? "#000" : "#fff",
                    boxShadow: "3px 3px 0 #000",
                  }}
                >
                  {project.status}
                </span>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3
                  className="text-2xl font-black uppercase mb-3 text-black"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {project.title}
                </h3>
                <p className="text-sm font-semibold text-black/80 leading-relaxed mb-5">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-black uppercase border-2 border-black px-2.5 py-1 bg-white text-black"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex gap-3">
                  <a
                    href={project.link}
                    className="flex-1 bg-black text-white border-4 border-black py-3 font-black uppercase text-sm text-center inline-flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-colors"
                    style={{ boxShadow: "4px 4px 0 #000" }}
                  >
                    <ExternalLink size={14} strokeWidth={3} /> Live Demo
                  </a>
                  <a
                    href={project.github}
                    className="border-4 border-black bg-white text-black p-3 hover:bg-black hover:text-white transition-colors"
                    style={{ boxShadow: "4px 4px 0 #000" }}
                    aria-label="GitHub"
                  >
                    <Github size={18} strokeWidth={2} />
                  </a>
                  <a
                    href={project.link}
                    className="border-4 border-black bg-white text-black p-3 hover:bg-[#2196F3] hover:text-white hover:border-[#2196F3] transition-colors"
                    style={{ boxShadow: "4px 4px 0 #000" }}
                    aria-label="View project"
                  >
                    <ArrowUpRight size={18} strokeWidth={3} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
