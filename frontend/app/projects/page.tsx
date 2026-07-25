"use client";

import { useState, useEffect, useRef } from "react";
import { Github, Star, GitFork, Clock, Link as LinkIcon } from "lucide-react";
import { ML_PROJECTS, isMLRepo } from "@/lib/featured-repos";
import { MOTION, ScrollTrigger, gsap, useGSAP, usePageMotion } from "@/lib/motion";

interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
  language: string;
}

// Hardcoded fallback surfaced when the GitHub API fails or returns nothing 
// mirrors the /ml "Recent work" list so the page never appears broken.
const FALLBACK_REPOS: Repository[] = ML_PROJECTS.map((project, idx) => ({
  id: -1 - idx,
  name: project.repoName ?? project.title,
  description: project.summary,
  html_url: project.url,
  stargazers_count: 0,
  forks_count: 0,
  updated_at: new Date().toISOString(),
  topics: project.stack.map((stack) => stack.toLowerCase()),
  language: project.stack[0] ?? "Python",
}));

export default function Projects() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isFallback, setIsFallback] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  usePageMotion(pageRef);

  useEffect(() => {
    const controller = new AbortController();
    // Guard against the GitHub API hanging  after 8s we flip to the fallback
    // so visitors never see an indefinite "Loading repositories..." state.
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort("timeout");
    }, 8000);

    const fetchRepos = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/users/JacobDrizzle/repos?sort=updated&per_page=100",
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`GitHub API ${response.status}`);
        const data: Repository[] = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("No repos returned");
        clearTimeout(timeout);
        setRepos(data);
        setLoading(false);
      } catch (error) {
        clearTimeout(timeout);
        // StrictMode double-mount / route change aborts the request  leave state untouched so
        // the remount's fetch owns the UI. Check the signal directly (reason may be a string).
        if (controller.signal.aborted && !timedOut) return;
        console.error("Error fetching repos, using fallback:", error);
        setRepos(FALLBACK_REPOS);
        setIsFallback(true);
        setLoading(false);
      }
    };

    fetchRepos();
    return () => {
      clearTimeout(timeout);
      controller.abort("unmount");
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get unique languages for filter.
  const languages = ["all", ...new Set(repos.map((repo) => repo.language).filter(Boolean))];

  // ML/AI projects first; within each group keep the API's ordering (updated desc).
  const sortedRepos = [...repos].sort((a, b) => {
    const aML = isMLRepo(a) ? 0 : 1;
    const bML = isMLRepo(b) ? 0 : 1;
    return aML - bML;
  });

  const filteredRepos = sortedRepos.filter((repo) =>
    filter === "all" ? true : repo.language === filter,
  );

  useGSAP(
    () => {
      if (loading || !gridRef.current) return;

      const cards = Array.from(
        gridRef.current.querySelectorAll<HTMLElement>("[data-project-card]"),
      );
      const media = gsap.matchMedia();

      media.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          allowMotion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { reduceMotion } = context.conditions as {
            reduceMotion: boolean;
            allowMotion: boolean;
          };

          if (reduceMotion) {
            gsap.set(cards, {
              clearProps: "transform,opacity,visibility,willChange",
            });
            return;
          }

          gsap.fromTo(
            cards,
            {
              autoAlpha: 0,
              y: 16,
              willChange: "transform,opacity",
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: MOTION.duration.enter,
              ease: MOTION.ease.enter,
              stagger: MOTION.stagger.items,
              onComplete: () => {
                gsap.set(cards, {
                  clearProps: "transform,opacity,visibility,willChange",
                });
              },
            },
          );
        },
        gridRef.current,
      );

      const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
      return () => {
        cancelAnimationFrame(refreshFrame);
        media.revert();
      };
    },
    {
      scope: gridRef,
      dependencies: [loading, filter, filteredRepos.length],
      revertOnUpdate: true,
    },
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-green-400">
      <main ref={pageRef} className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        {/* Header */}
        <header data-animate="intro" className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-green-400 mb-4">
            <span className="motion-icon">
              <Github className="inline-block mr-3 mb-1" />
            </span>
            My Projects
          </h1>
          <p className="text-xl text-gray-700 dark:text-green-500/80">
            ML-first work up top  RAG, agents, and predictive models.
          </p>
          {isFallback && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-500/70 font-mono">
              GitHub API unavailable  showing featured projects.
            </p>
          )}
        </header>

        {/* Language Filter */}
        <div data-animate="intro" className="flex flex-wrap gap-2 mb-8 justify-center">
          {languages.map((language) => (
            <button
              key={language}
              onClick={() => setFilter(language)}
              aria-pressed={filter === language}
              className={`motion-button px-4 py-2 rounded-full text-sm font-mono
                ${filter === language
                  ? "bg-green-600 dark:bg-green-500 text-white dark:text-black shadow-lg shadow-green-500/30"
                  : "border border-green-400 dark:border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/20"}`}
            >
              {language.charAt(0).toUpperCase() + language.slice(1)}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center text-green-600 dark:text-green-500">
            <div className="animate-pulse text-lg">Loading repositories...</div>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRepos.map((repo) => (
              <article
                key={repo.id}
                data-project-card
                className="motion-lift border border-green-200 dark:border-green-500/30 rounded-lg p-6 bg-green-50 dark:bg-green-500/5 hover:border-green-400 dark:hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">
                    {repo.name}
                  </h3>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${repo.name} on GitHub`}
                    className="motion-icon text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </a>
                </div>

                <p className="text-gray-700 dark:text-green-500/80 mb-4 h-30 overflow-hidden leading-relaxed">
                  {repo.description || "No description provided"}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {repo.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 cursor-default"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-green-700 dark:text-green-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-4 h-4" />
                      {repo.forks_count}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-gray-600 dark:text-green-500/70">
                    <Clock className="w-4 h-4" />
                    {formatDate(repo.updated_at)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
