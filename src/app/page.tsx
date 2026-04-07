import type { Metadata } from "next";
import Hero from "@/components/portfolio/Hero";
import Projects from "@/components/portfolio/Projects";
import Stack from "@/components/portfolio/Stack";
import Experience from "@/components/portfolio/Experience";

export const metadata: Metadata = {
  title: "Saurabh | Full-Stack Engineer",
  description:
    "Portfolio of Saurabh — Full-Stack Engineer crafting fast, accessible, and brutally honest web experiences.",
  openGraph: {
    title: "Saurabh | Full-Stack Engineer",
    description:
      "Portfolio of Saurabh — Full-Stack Engineer crafting fast, accessible, and brutally honest web experiences.",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Projects />
      <Stack />
      <Experience />
    </main>
  );
}
