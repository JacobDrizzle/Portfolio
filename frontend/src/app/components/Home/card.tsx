import { Boxes } from "../ui/background_boxes";

interface CardProps {
  title: string;
  sub_title: string;
  description: string;
  alt_description: string;
}

const HeroCard: React.FC<CardProps> = ({
  title,
  sub_title,
  description,
  alt_description,
}) => {
  return (
    <div className="pt-4 flex justify-center overflow-hidden">
      <div
        className="bg-slate-800 max-w-3xl dark:bg-black text-slate-950 w-fit 
          border border-neutral-500 dark:border-[rgba(255,255,255,0.1)] hover:border-emerald-400
          dark:hover:border-emerald-400 rounded-2xl shadow-2xl shadow-black dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1]"
      >
        <div className="relative p-4 w-full overflow-hidden flex flex-col rounded-lg">
          <div className="absolute inset-0 w-full h-full z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
          <Boxes />
          <h1 className="text-xl font-mono font-extrabold text-neutral-300 dark:text-neutral-300">
            {title}
          </h1>
          <p className="text-sm font-mono mt-2 font-light tracking-wide text-neutral-300 dark:text-neutral-300">
            {description}
          </p>
          <h1 className="text-xl font-mono mt-2 font-extrabold text-neutral-300 dark:text-neutral-300">
            {sub_title}
          </h1>
          <p className="text-sm font-mono mt-2 font-light tracking-wide text-neutral-300 dark:text-neutral-300">
            {alt_description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;
