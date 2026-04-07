"use client";

import { motion } from "framer-motion";

type Tool = {
  name: string;
  icon: string;
  level: "Expert" | "Proficient" | "Learning";
  color: string;
};

const categories: { label: string; tools: Tool[] }[] = [
  {
    label: "Frontend",
    tools: [
      { name: "React 19", icon: "⚛️", level: "Expert", color: "#2196F3" },
      { name: "Next.js 16", icon: "▲", level: "Expert", color: "#000" },
      { name: "TypeScript", icon: "TS", level: "Expert", color: "#2196F3" },
      { name: "Tailwind CSS", icon: "🌊", level: "Expert", color: "#2196F3" },
      { name: "Framer Motion", icon: "✦", level: "Proficient", color: "#F44336" },
      { name: "SvelteKit", icon: "🔥", level: "Proficient", color: "#F44336" },
    ],
  },
  {
    label: "Backend",
    tools: [
      { name: "Node.js", icon: "🟢", level: "Expert", color: "#4CAF50" },
      { name: "Firebase", icon: "🔥", level: "Expert", color: "#FFEB3B" },
      { name: "PostgreSQL", icon: "🐘", level: "Proficient", color: "#2196F3" },
      { name: "Redis", icon: "⚡", level: "Proficient", color: "#F44336" },
      { name: "GraphQL", icon: "◈", level: "Proficient", color: "#F44336" },
      { name: "Prisma", icon: "◆", level: "Proficient", color: "#000" },
    ],
  },
  {
    label: "DevOps & AI",
    tools: [
      { name: "Docker", icon: "🐳", level: "Proficient", color: "#2196F3" },
      { name: "Vercel", icon: "▲", level: "Expert", color: "#000" },
      { name: "GitHub CI/CD", icon: "⚙️", level: "Proficient", color: "#000" },
      { name: "Gemini AI", icon: "✦", level: "Expert", color: "#F44336" },
      { name: "OpenAI", icon: "◎", level: "Proficient", color: "#4CAF50" },
      { name: "Cloudflare", icon: "☁️", level: "Learning", color: "#FFEB3B" },
    ],
  },
];

const levelColors: Record<Tool["level"], string> = {
  Expert: "#FFEB3B",
  Proficient: "#2196F3",
  Learning: "#F44336",
};

const levelTextColors: Record<Tool["level"], string> = {
  Expert: "#000",
  Proficient: "#fff",
  Learning: "#fff",
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export default function Stack() {
  return (
    <section id="stack" className="py-20 px-6 md:px-16 bg-[#2196F3] border-b-4 border-black">
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
            className="text-xs font-black uppercase tracking-[0.3em] bg-black text-[#FFEB3B] border-4 border-black px-3 py-1 inline-block mb-4"
            style={{ boxShadow: "4px 4px 0 #FFEB3B" }}
          >
            My Arsenal
          </span>
          <h2
            className="text-5xl md:text-7xl font-black uppercase leading-none text-white"
            style={{ fontFamily: "var(--font-space-grotesk)", textShadow: "4px 4px 0 #000" }}
          >
            Tech Stack
          </h2>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="flex flex-wrap gap-3 mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {(["Expert", "Proficient", "Learning"] as Tool["level"][]).map((lvl) => (
            <span
              key={lvl}
              className="text-xs font-black uppercase border-4 border-black px-3 py-1"
              style={{
                backgroundColor: levelColors[lvl],
                color: levelTextColors[lvl],
                boxShadow: "3px 3px 0 #000",
              }}
            >
              {lvl}
            </span>
          ))}
        </motion.div>

        {/* Categories */}
        <div className="space-y-10">
          {categories.map((cat, ci) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: ci * 0.1 }}
            >
              <h3
                className="text-sm font-black uppercase tracking-[0.2em] text-white mb-4 border-b-4 border-black pb-2"
              >
                {cat.label}
              </h3>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                {cat.tools.map((tool) => (
                  <motion.div
                    key={tool.name}
                    variants={itemVariants}
                    whileHover={{ y: -4, x: -4 }}
                    className="bg-white border-4 border-black p-3 flex flex-col items-center gap-2 cursor-default select-none"
                    style={{
                      boxShadow: "6px 6px 0 #000",
                      transition: "box-shadow 0.15s, transform 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `8px 8px 0 ${tool.color}`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0 #000";
                    }}
                  >
                    <span className="text-2xl" aria-hidden>
                      {tool.icon}
                    </span>
                    <span
                      className="text-xs font-black text-center leading-tight text-black"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      {tool.name}
                    </span>
                    <span
                      className="text-[10px] font-black uppercase border-2 border-black px-2 py-0.5 w-full text-center"
                      style={{
                        backgroundColor: levelColors[tool.level],
                        color: levelTextColors[tool.level],
                      }}
                    >
                      {tool.level}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
