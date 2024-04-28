"use client"
import React, { useEffect, useState } from "react";
import RepoCard from "./repo_card";
import { fetchRepos } from "@/app/api/github";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string;
}

const RepoLayout = () => {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const repo_response = await fetchRepos();
        setRepos(repo_response);
      } catch (error) {
        setError("Failed to fetch GitHub user data");
      }
    };
    fetchUser();
  }, []);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {repos?.map((repo: Repo) => (
        <RepoCard
          key={repo.id}
          name={repo.name}
          fullName={repo.full_name}
          nodeId={repo.description}
        />
      ))}
    </div>
  );
};

export default RepoLayout;
