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

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-green-400">
      <main className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-green-700/80 dark:text-green-500/80">
              Let&apos;s collaborate on something amazing
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <p className="flex items-center gap-3 text-green-700/80 dark:text-green-500/80">
                    <Mail className="w-5 h-5 text-green-500" />
                    jd_git@protonmail.com
                  </p>
                  <p className="flex items-center gap-3 text-green-700/80 dark:text-green-500/80">
                    <MapPin className="w-5 h-5 text-green-500" />
                    Kenmare Co.Kerry
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h2 className="text-2xl font-semibold mb-6">Connect With Me</h2>
                <div className="flex space-x-4">
                  <a href="https://github.com/JacobDrizzle" target="_blank" className="text-green-500 hover:text-green-400 transition-colors">
                    <Github className="w-6 h-6" />
                  </a>
                  <a href="https://www.linkedin.com/in/jacob-dorrill/" target="_blank" className="text-green-500 hover:text-green-400 transition-colors">
                    <Linkedin className="w-6 h-6" />
                  </a>
                  <a href="https://twitter.com/Jacob_Drizzle" target="_blank" className="text-green-500 hover:text-green-400 transition-colors">
                    <Twitter className="w-6 h-6" />
                  </a>
                </div>
              </div>

              <div className="bg-green-500/5 border border-green-500/30 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Open for Opportunities</h3>
                <p className="text-green-700/80 dark:text-green-500/80">
                  Currently seeking my first developer role. Let&apos;s discuss how I can contribute to your team!
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div variants={itemVariants}>
              <form onSubmit={handleSubmit} className="space-y-2 mt-[5px]">
                
                {/* Optional but recommended: subject */}
                <input 
                  type="hidden" 
                  name="subject" 
                  value="New Contact Form Submission from Portfolio"
                />

                {submitStatus.type && (
                  <div className={`p-4 rounded-md ${
                    submitStatus.type === 'success' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {submitStatus.message}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-2 rounded-md border border-green-500/30 bg-green-500/5 focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-2 rounded-md border border-green-500/30 bg-green-500/5 focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full px-4 py-2 rounded-md border border-green-500/30 bg-green-500/5 focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.05 }}
                  className="w-full bg-green-500/20 px-6 py-3 rounded-md border border-green-500 hover:bg-green-500/30 transition-colors font-mono flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    'Sending...'
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