"use client";
import React, { useEffect, useState } from "react";
import RepoCard from "./repo_card";
import { fetchRepos } from "@/app/api/github";

interface Repo {
  id: number;
  name: string;
  language: string;
  languages: string[];
  full_name: string;
  private: boolean;
  description: string;
  html_url: string;
}

const RepoLayout = () => {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const repo_response = await fetchRepos();
        // Filter out repos where language is empty string
        const filteredRepos = repo_response.filter(
          (repo: Repo) => repo.language !== null
        );
        console.log("Repos: ", repo_response);
        setRepos(filteredRepos);
      } catch (error) {
        setError("Failed to fetch GitHub user data");
      }
    };
    fetchUser();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!repos) {
    return <div className="text-gray-500">Fetching Repos...</div>;
  }

  return (
    <div className="flex flex-col justify-center items-center h-full gap-4 text-neutral-200">
      <div className="grid xl:grid-cols-2 md:grid-cols-1 gap-10">
        {repos?.map((repo: Repo) => (
          <RepoCard
          key={repo.id}
          name={repo.name}
          fullName={repo.full_name}
          languages={repo.languages}
          description={repo.description}
          url={repo.html_url}
          />
        ))}
      </div>
    </div>
  );
};

export default RepoLayout;
