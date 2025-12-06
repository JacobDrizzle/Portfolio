"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Star, GitFork, Clock, Link as LinkIcon } from 'lucide-react';

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

export default function Projects() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch('https://api.github.com/users/JacobDrizzle/repos?sort=updated');
        const data = await response.json();
        setRepos(data);
      } catch (error) {
        console.error('Error fetching repos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  const cardHover = {
    y: -8,
    scale: 1.02,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  };

  // Get unique languages for filter
  const languages = ['all', ...new Set(repos.map(repo => repo.language).filter(Boolean))];

  const filteredRepos = repos.filter(repo => 
    filter === 'all' ? true : repo.language === filter
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-green-400">
      <main className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-green-400 mb-4">
            <motion.span
              className="inline-block"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Github className="inline-block mr-3 mb-1" />
            </motion.span>
            My Projects
          </h1>
          <p className="text-xl text-gray-600 dark:text-green-500/80">
            Exploring innovation through code
          </p>
        </motion.div>

        {/* Language Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap gap-2 mb-8 justify-center"
        >
          {languages.map((lang, index) => (
            <motion.button
              key={lang}
              onClick={() => setFilter(lang)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-mono transition-all duration-200
                ${filter === lang
                  ? 'bg-green-600 dark:bg-green-500 text-white dark:text-black shadow-lg shadow-green-500/30'
                  : 'border border-green-400 dark:border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/20'}`}
            >
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center text-green-600 dark:text-green-500">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg"
            >
              Loading repositories...
            </motion.div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRepos.map(repo => (
              <motion.div
                key={repo.id}
                variants={itemVariants}
                whileHover={cardHover}
                className="border border-green-200 dark:border-green-500/30 rounded-lg p-6 bg-green-50 dark:bg-green-500/5 hover:border-green-400 dark:hover:border-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/10 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">
                    {repo.name}
                  </h3>
                  <motion.a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400"
                    whileHover={{ scale: 1.2, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <LinkIcon className="w-5 h-5" />
                  </motion.a>
                </div>

                <p className="text-gray-600 dark:text-green-500/80 mb-4 h-30 overflow-hidden leading-relaxed">
                  {repo.description || 'No description provided'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {repo.topics.map((topic, index) => (
                    <motion.span
                      key={topic}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.1 }}
                      className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 cursor-default"
                    >
                      {topic}
                    </motion.span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-green-700 dark:text-green-500">
                  <div className="flex items-center gap-4">
                    <motion.span
                      className="flex items-center gap-1"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Star className="w-4 h-4" />
                      {repo.stargazers_count}
                    </motion.span>
                    <motion.span
                      className="flex items-center gap-1"
                      whileHover={{ scale: 1.1 }}
                    >
                      <GitFork className="w-4 h-4" />
                      {repo.forks_count}
                    </motion.span>
                  </div>
                  <span className="flex items-center gap-1 text-gray-500 dark:text-green-500/70">
                    <Clock className="w-4 h-4" />
                    {formatDate(repo.updated_at)}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}