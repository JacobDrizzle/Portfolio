"use client"
import Head from 'next/head';
import { useState } from 'react';
import DarkModeToggle from './theme_switch';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <Head>
        <title>My Portfolio</title>
      </Head>
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;