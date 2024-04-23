interface CardProps {
    title: string,
    sub_title: string,
    description: string
    alt_description: string
  }
  
const HeroCard: React.FC<CardProps>  = ({title, sub_title, description, alt_description}) => {
  return (
    <div className="pt-10 flex justify-center">
      <div className='bg-slate-800 max-w-4xl dark:bg-black p-4 text-slate-950 w-fit 
                        border border-neutral-500 dark:border-[rgba(255,255,255,0.1)] hover:border-emerald-400 dark:hover:border-emerald-400 rounded-2xl shadow-2xl shadow-black'>
          <h1 className="text-xl font-extrabold text-neutral-300 dark:text-neutral-300">{title}</h1>
          <p className="text-sm mt-2 font-light tracking-wide text-neutral-300 dark:text-neutral-300">{description}</p>
          <h1 className="text-xl mt-2 font-extrabold text-neutral-300 dark:text-neutral-300">{sub_title}</h1>
          <p className="text-sm mt-2 font-light tracking-wide text-neutral-300 dark:text-neutral-300">{alt_description}</p>
      </div>
    </div>
  );
};

export default HeroCard;