import Image from "next/image";
import Navbar from "./nav";


const ImageCard = () => {
  return (
    <div className="mt-[18px] 2xl:max-h-[505px] w-[360px] p-8 border border-neutral-500 dark:border-[rgba(255,255,255,0.1)] hover:border-emerald-400
    dark:hover:border-emerald-400 rounded-2xl shadow-2xl shadow-black">
        <div className="pl-4">
            <Image
                src="/profile.png"
                alt="avatar"
                height="400"
                width="300"
                className='h-[400px] w-fit rounded-xl'
                />
        </div>
            <ul className="flex flex-row justify-center mt-4 px-2 pl-2">
                <li className="mr-1 py-1 px-4 rounded-full">
                    <a href="/resume" className="text-gray-100 hover:text-emerald-400">
                    Resume
                    </a>
                </li>
                <li className="mr-1 py-1 px-4 rounded-full">
                    <a href="/" className="text-gray-100 hover:text-emerald-400">
                    About
                    </a>
                </li>
                <li className="mr-1 py-1 px-4 rounded-full">
                    <a href="#" className="text-gray-100 hover:text-emerald-400">
                    Contact
                    </a>
                </li>
            </ul>
    </div>
  );
};

export default ImageCard;