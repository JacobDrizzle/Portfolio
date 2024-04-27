"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const BoxesCore = ({ className, ...rest }: { className?: string }) => {
  const rows = new Array(150).fill(1);
  const cols = new Array(100).fill(1);
  let colors = [
    "--[rgba(125,211,252,0.4)]", //sky-300
    "--[rgba(249,168,212,0.4)]", // pink-300
    "--[rgba(134,239,172,0.4)]", // green-300
    "--[rgba(253,224,71,0.4)]",  // yellow-300
    "--[rgba(252,165,165,0.4)]", // red-300
    "--[rgba(216,180,254,0.4)]", // purple-300
    "--[rgba(147,197,253,0.4)]", // blue-300
    "--[rgba(165,180,252,0.4)]", // indego-300
    "--[rgba(196,181,253,0.4)]", // violet-300
  ];
  const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div
      style={{
        transform: `translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)`,
      }}
      className={cn(
        "absolute left-1/4 p-4 -top-1/4 flex  -translate-x-1/2 -translate-y-1/2 w-full h-full z-0 ",
        className
      )}
      {...rest}
    >
      {rows.map((_, i) => (
        <motion.div
          key={`row` + i}
          className="w-16 h-8 border-l border-slate-700 relative"
        >
          {cols.map((_, j) => (
            <motion.div
              whileHover={{
                backgroundColor: `var(${getRandomColor()})`,
                transition: { duration: 0 },
              }}
              animate={{
                transition: { duration: 2 },
              }}
              key={`col` + j}
              className="w-16 h-8  relative"
            >
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);
