import React from "react";
import LanguageBadge from "../ui/lang_badge";
import Image from "next/image";
import { motion } from "framer-motion";

interface RepoCardProps {
  name: string;
  fullName: string;
  languages: string[];
  description: string;
  url: string;
}

const RepoCard: React.FC<RepoCardProps> = ({
  name,
  fullName,
  languages,
  description,
  url,
}: RepoCardProps) => {
  return (
    <div className="flex border border-neutral-500 hover:border-emerald-400 p-4 mt-4 rounded-xl bg-slate-800 dark:bg-black">
      <div className="flex flex-col justify-between xl:max-w-xl">
        <div>
          <a href={url} target="_blank">
            <h2 className="text-2xl font-mono font-bold hover:text-emerald-400">
              {name}
            </h2>
          </a>
          <div className="mt-2">
            <span className="font-bold">Description:</span> {description}
          </div>
        </div>
        <div className="flex justify-between">
          <div className="mt-2">
            <span className="font-bold">Languages:</span>
            <LanguageBadge languages={languages} />
          </div>
          <motion.div 
            className="flex items-center justify-end"
            whileHover={{ scale: 1.25, rotateZ: -12 }}
          >
            <a href={url} target="_blank">
              <Image
                height="60"
                width="60"
                alt="l"
                className="mr-4"
                src={`https://cdn.simpleicons.org/github/FFFFFF`}
              />
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RepoCard;
