import Head from 'next/head';
import HeroCard from './card';
import { ProjectsGrid } from './grid_container';
import Navbar from './nav';

const Hero = () => {
    const heroCards = [
      {
        title: 'Welcome!',
        sub_title: 'From Roots to Routes',
        description: 'Hey there! 👋 My name is Jacob Dorrill a software engineer with a unique journey that bridges the worlds of nature and technology.',     
        alt_description: 'Originally trained as a landscaper and certified in organic horticulture, my journey took an unexpected turn when the COVID-19 pandemic prompted me to explore the world of programming. What started as a hobby quickly grew into a full-blown passion, and today, programming is at the heart of everything I do.'     
    },
    {
        title: 'What I Build With!',
        sub_title: 'What im Working on.',
        description: 'My toolbox consist of C++, Java, with a dash of TypeScirpt and Python. If you\'re on the hunt for an versatile virtuoso who\'s also got some backend boogie, look no further. Hit me up!',     
        alt_description: 'One of my current undertakings involves collaborating with my brother on building a cutting-edge graphics API for a game engine. This project not only allows me to flex my technical muscles but also reinforces the importance of teamwork and creative problem-solving.'
      }
    ];
  
    return (
      <div className="pt-4 justify-center px-12 bg-slate-900 dark:bg-black">
        <Navbar />
        <h1 className="text-2xl pt-4 text-center font-bold">JacobDrizzle.dev</h1>
        {heroCards.map((card, index) => (
          <HeroCard key={index} title={card.title} sub_title={card.sub_title} description={card.description}  alt_description={card.alt_description}/>
        ))}
        <ProjectsGrid />
      </div>
    );
}
export default Hero;