import React from "react";
import LanguageBadge from "../ui/lang_badge";
import Image from "next/image";

interface RepoCardProps {
  name: string;
  fullName: string;
  language: string;
  description: string;
  url: string;
}

const RepoCard: React.FC<RepoCardProps> = ({
  name,
  fullName,
  language,
  description,
  url,
}: RepoCardProps) => {
  return (
    <div className="flex border border-neutral-500 p-4 mt-4 rounded-xl max-w-7xl w-full justify-between">
      <div className="max-w-3xl">
        <a href={url} target="_blank">
          <h2 className="text-2xl font-mono font-bold hover:text-emerald-400">
            {name}
          </h2>
        </a>
        <p className="mt-2">
          <span className="font-bold">Description:</span> {description}
        </p>
        <p className="mt-2">
          <span className="font-bold">Language:</span>{" "}
          <LanguageBadge language={language} />
        </p>
      </div>
      <div className="flex justify-center">
        <Image
          height="120"
          width="120"
          alt="l"
          className="ml-3"
          src={`https://cdn.simpleicons.org/github/FFFFFF`}
        />
      </div>
    </div>
  );
};

export default RepoCard;
