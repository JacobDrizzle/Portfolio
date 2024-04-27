import HeroCard from './card';
import { ProjectsGrid } from './grid_container';
import Navbar from './nav';
import Footer from '../Footer/footer';
import ImageCard from './image_container';

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
        description: 'My toolbox consist of C++, Java, with a dash of TypeScirpt and Python. If you\'re on the hunt for an versatile virtuoso who also knows how to handle a backend, look no further. Hit me up!',     
        alt_description: 'One of my current undertakings involves collaborating with my brother on building a cutting-edge graphics API for a game engine. This project not only allows me to flex my technical muscles but also reinforces the importance of teamwork and creative problem-solving.'
      }
    ];
  
    return (
      <div className="justify-center bg-slate-900 dark:bg-black min-h-vh100 min-w-100vw">
        <Navbar />
        <div className="pt-4 pb-4 px-12">
          <h1 className="text-4xl 2xl:mx-[330px] font-mono mt-8 font-extrabold text-sky-500">&gt;About</h1>
          <h1 className="text-xl 2xl:mx-[330px] font-mono mt-3 font-extrabold text-gray-500">Just your average dev...</h1>
          <div className="md:flex sm:flex-column justify-center gap-4">
            <div>
              {heroCards.map((card, index) => (
                <HeroCard key={index} title={card.title} sub_title={card.sub_title} description={card.description}  alt_description={card.alt_description}/>
              ))}
            </div>
            <ImageCard />
          </div>
          <div>
              <ProjectsGrid />
              <Footer />
          </div>
        </div>
      </div>
    );
}
export default Hero;