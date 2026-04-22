"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, Linkedin, Twitter, MessageSquare, Send, MapPin } from 'lucide-react';

export default function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("access_key", "7b1a2e63-d344-4f5e-9961-b69011a963dd");
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Message sent successfully! I\'ll get back to you soon.',
        });
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send message. Please try again.',
      });
      console.log(error)
    } finally {
      setSubmitting(false);
    }
  };

  const EASE_OUT = [0.22, 1, 0.36, 1] as const;
  const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: EASE_OUT
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-green-400">
      <main className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-green-400 mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-700 dark:text-green-500/80">
              Let&apos;s collaborate on something amazing
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-green-400">
                  <motion.div
                    whileHover={{ y: -1, scale: 1.05 }}
                    transition={{ duration: 0.15, ease: EASE_IN_OUT }}
                  >
                    <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-500" />
                  </motion.div>
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <motion.p
                    className="flex items-center gap-3 text-gray-700 dark:text-green-500/80"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.15, ease: EASE_IN_OUT }}
                  >
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-500" />
                    jd_git@protonmail.com
                  </motion.p>
                  <motion.p
                    className="flex items-center gap-3 text-gray-700 dark:text-green-500/80"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.15, ease: EASE_IN_OUT }}
                  >
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-500" />
                    Kenmare Co.Kerry
                  </motion.p>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">Connect With Me</h2>
                <div className="flex space-x-4">
                  {[
                    { href: "https://github.com/JacobDrizzle", Icon: Github },
                    { href: "https://www.linkedin.com/in/jacob-dorrill/", Icon: Linkedin },
                    { href: "https://twitter.com/Jacob_Drizzle", Icon: Twitter }
                  ].map(({ href, Icon }, index) => (
                    <motion.a
                      key={href}
                      href={href}
                      target="_blank"
                      className="text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400 transition-colors"
                      whileHover={{ y: -2, scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.3, ease: EASE_OUT }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.a>
                  ))}
                </div>
              </div>

              <motion.div
                className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 p-6 rounded-lg hover:border-green-400 dark:hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10"
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ duration: 0.25, ease: EASE_IN_OUT }}
              >
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-green-400">Open for Opportunities</h3>
                <p className="text-gray-700 dark:text-green-500/80 leading-relaxed">
                  Currently seeking my first developer role. Let&apos;s discuss how I can contribute to your team!
                </p>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div variants={itemVariants}>
              <form onSubmit={handleSubmit} className="space-y-4 mt-[5px]">

                {/* Optional but recommended: subject */}
                <input
                  type="hidden"
                  name="subject"
                  value="New Contact Form Submission from Portfolio"
                />

                {submitStatus.type && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-md ${
                      submitStatus.type === 'success'
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30'
                        : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                    }`}
                  >
                    {submitStatus.message}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-green-400">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-2 rounded-md border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-gray-900 dark:text-green-400"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-green-400">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 rounded-md border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-gray-900 dark:text-green-400"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-700 dark:text-green-400">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full px-4 py-2 rounded-md border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-gray-900 dark:text-green-400 resize-none"
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15, ease: EASE_IN_OUT }}
                  className="w-full bg-green-600 dark:bg-green-500/20 px-6 py-3 rounded-md border border-green-600 dark:border-green-500 text-white dark:text-green-400 hover:bg-green-700 dark:hover:bg-green-500/30 transition-colors font-mono flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      Sending...
                    </motion.span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}