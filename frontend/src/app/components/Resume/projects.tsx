"use client";
import Image from "next/image";
import { fetchGitHubUser, fetchRepos } from "../../api/github";
import { useState, useEffect } from "react";
interface GitHubUser {
  login: string;
  name: string;
  bio: string;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
}

const ProfileCard = () => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchGitHubUser();
        setUser(response);
      } catch (error) {
        setError("Failed to fetch GitHub user data");
      }
    };
    fetchUser();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center border border-white rounded-xl w-fit p-6 bg-slate-800 dark:bg-black">
      <a href="https://github.com/JacobDrizzle" target="_blank">
        <Image
          src={user.avatar_url}
          alt={user.login}
          width={24}
          height={24}
          className="w-24 h-24 rounded-full"
        />
      </a>
      <a href="https://github.com/JacobDrizzle" target="_blank">
        <h2 className="text-2xl font-bold hover:text-emerald-400">
          {user.name}
        </h2>
      </a>
      <p className="text-gray-200">{user.bio}</p>
      <ul className="list-none mb-4">
        <li>
          <span className="text-gray-200">Followers:</span> {user.followers}
        </li>
        <li>
          <span className="text-gray-200">Following:</span> {user.following}
        </li>
        <li>
          <span className="text-gray-200">Public Repos:</span>{" "}
          {user.public_repos}
        </li>
      </ul>
    </div>
  );
};

export default ProfileCard;
