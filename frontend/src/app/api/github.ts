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
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch GitHub Repos');
    }
}