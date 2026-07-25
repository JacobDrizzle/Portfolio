"use client";

import { useRef, useState } from "react";
import { Mail, Github, Linkedin, Twitter, MessageSquare, Send, MapPin } from "lucide-react";
import { MOTION, gsap, useGSAP, usePageMotion } from "@/lib/motion";

export default function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const pageRef = useRef<HTMLElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  usePageMotion(pageRef);

  useGSAP(
    () => {
      if (!submitStatus.type || !statusRef.current) return;

      const status = statusRef.current;
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
            gsap.set(status, {
              clearProps: "transform,opacity,visibility,willChange",
            });
            return;
          }

          gsap.fromTo(
            status,
            {
              autoAlpha: 0,
              y: -10,
              willChange: "transform,opacity",
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: MOTION.duration.base,
              ease: MOTION.ease.enter,
              onComplete: () => {
                gsap.set(status, {
                  clearProps: "transform,opacity,visibility,willChange",
                });
              },
            },
          );
        },
        status,
      );

      return () => media.revert();
    },
    {
      scope: statusRef,
      dependencies: [submitStatus.type, submitStatus.message],
      revertOnUpdate: true,
    },
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const formData = new FormData(form);
      formData.append("access_key", "7b1a2e63-d344-4f5e-9961-b69011a963dd");
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({
          type: "success",
          message: "Message sent successfully! I'll get back to you soon.",
        });
        form.reset();
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Failed to send message. Please try again.",
      });
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-green-400">
      <main ref={pageRef} className="container mx-auto px-4 pt-24 pb-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header data-animate="intro" className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-green-400 mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-700 dark:text-green-500/80">
              Let&apos;s collaborate on something amazing
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <section data-animate="intro" className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-green-400">
                  <span className="motion-icon">
                    <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-500" />
                  </span>
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <p className="motion-link flex items-center gap-3 text-gray-700 dark:text-green-500/80">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-500" />
                    jd_git@protonmail.com
                  </p>
                  <p className="motion-link flex items-center gap-3 text-gray-700 dark:text-green-500/80">
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-500" />
                    Kenmare Co.Kerry
                  </p>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-green-400">
                  Connect With Me
                </h2>
                <div className="flex space-x-4">
                  {[
                    { href: "https://github.com/JacobDrizzle", label: "GitHub", Icon: Github },
                    { href: "https://www.linkedin.com/in/jacob-dorrill/", label: "LinkedIn", Icon: Linkedin },
                    { href: "https://twitter.com/Jacob_Drizzle", label: "Twitter", Icon: Twitter },
                  ].map(({ href, label, Icon }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="motion-icon text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400"
                    >
                      <Icon className="w-6 h-6" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="motion-lift bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/30 p-6 rounded-lg hover:border-green-400 dark:hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-green-400">
                  Open for Opportunities
                </h3>
                <p className="text-gray-700 dark:text-green-500/80 leading-relaxed">
                  Currently seeking my first developer role. Let&apos;s discuss how I can contribute to your team!
                </p>
              </div>
            </section>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-[5px]">
              <input
                type="hidden"
                name="subject"
                value="New Contact Form Submission from Portfolio"
              />

              {submitStatus.type && (
                <div
                  ref={statusRef}
                  role="status"
                  aria-live="polite"
                  className={`p-4 rounded-md ${
                    submitStatus.type === "success"
                      ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30"
                      : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30"
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}

              <div data-animate="intro">
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
              </div>

              <div data-animate="intro">
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
              </div>

              <div data-animate="intro">
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
              </div>

              <div data-animate="intro">
                <button
                  type="submit"
                  disabled={submitting}
                  className="motion-button w-full bg-green-600 dark:bg-green-500/20 px-6 py-3 rounded-md border border-green-600 dark:border-green-500 text-white dark:text-green-400 hover:bg-green-700 dark:hover:bg-green-500/30 font-mono flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="animate-pulse">Sending...</span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
