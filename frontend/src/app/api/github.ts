import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const token = process.env.NEXT_PUBLIC_GIT_TOKEN;

export const fetchGitHubUser = async () => {
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    try {
        const response = await axios.get('https://api.github.com/users/JacobDrizzle', { headers });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch GitHub user data');
    }
};

export const fetchRepos = async () => {
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    try {
        const response = await axios.get('https://api.github.com/users/JacobDrizzle/repos', { headers });
        const repos = await Promise.all(response.data.map(async (repo:any) => {
            const languagesResponse = await fetchLanguages(repo.languages_url); // Fetch languages for each repo
            const languages = Object.keys(languagesResponse); // Get the keys of the languages object
            return { ...repo, languages }; // Add languages array to each repo object
        }));
        return repos;
    } catch (error) {
        throw new Error('Failed to fetch GitHub Repos');
    }
};


export const fetchLanguages = async (url: string) => {
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    try {
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch GitHub Repos');
    }
};
