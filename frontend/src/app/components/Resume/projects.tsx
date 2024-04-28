"use client"
import {fetchGitHubUser, fetchRepos} from '../../api/github';
import { useState, useEffect } from 'react';

interface GitHubUser {
  login: string;
  name: string;
  bio: string;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
}

const Projects = () => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchGitHubUser();
        console.log("Response: ", response)
        setUser(response);
      } catch (error) {
        setError('Failed to fetch GitHub user data');
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
    <div className="flex flex-col items-center p-4">
      <img src={user.avatar_url} alt={user.login} className="w-24 h-24 rounded-full" />
      <h2 className="text-2xl font-bold">{user.name}</h2>
      <p className="text-gray-600">{user.bio}</p>
      <ul className="list-none mb-4">
        <li>
          <span className="text-gray-600">Followers:</span> {user.followers}
        </li>
        <li>
          <span className="text-gray-600">Following:</span> {user.following}
        </li>
        <li>
          <span className="text-gray-600">Public Repos:</span> {user.public_repos}
        </li>
      </ul>
    </div>
  );
};

export default Projects;