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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Get unique languages for filter
  const languages = ['all', ...new Set(repos.map(repo => repo.language).filter(Boolean))];

  const filteredRepos = repos.filter(repo => 
    filter === 'all' ? true : repo.language === filter
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-green-400">
      <main className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-4">
            <Github className="inline-block mr-3 mb-1" />
            My Projects
          </h1>
          <p className="text-xl text-green-700/80 dark:text-green-500/80">
            Exploring innovation through code
          </p>
        </motion.div>

        {/* Language Filter */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 mb-8 justify-center"
        >
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => setFilter(lang)}
              className={`px-4 py-2 rounded-full text-sm font-mono transition-colors
                ${filter === lang 
                  ? 'bg-green-500 text-black' 
                  : 'border border-green-500 hover:bg-green-500/20'}`}
            >
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center text-green-500">
            <div className="animate-pulse">Loading repositories...</div>
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
                className="border border-green-500/30 rounded-lg p-6 bg-green-500/5 hover:bg-green-500/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    {repo.name}
                  </h3>
                  <a 
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </a>
                </div>
                
                <p className="text-green-700/80 dark:text-green-500/80 mb-4 h-30 overflow-hidden">
                  {repo.description || 'No description provided'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {repo.topics.map(topic => (
                    <span
                      key={topic}
                      className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-300"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-500">
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
                  <span className="flex items-center gap-1">
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