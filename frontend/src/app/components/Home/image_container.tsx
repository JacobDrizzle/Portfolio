import Image from "next/image";
import Navbar from "./nav";
import { CardBody, CardContainer, CardItem } from "../ui/3d_card";
import Link from "next/link";


const ImageCard = () => {
  return (
    <div className="justify-center mt-4">
        <CardContainer className="inter-var">
        <CardBody className="bg-slate-800 relative group/card shadow-2xl dark:hover:shadow-2xl shadow-black dark:hover:shadow-emerald-500/[0.1] dark:bg-black 
                             border-neutral-500 dark:border-[rgba(255,255,255,0.1)] hover:border-emerald-400
                             dark:hover:border-emerald-400 w-fit h-fit rounded-xl p-6 border">
            <CardItem translateZ="100">
            <Image
                src="/profile.png"
                height="1000"
                width="1000"
                className="lg:h-[380px] md:h-fit md:w-[320px] sm:w-[fill] rounded-xl group-hover/card:shadow-xl"
                alt="thumbnail"
            />
            </CardItem>
            <div className="flex justify-between items-center mt-4">
                <ul className="flex flex-row justify-center mt-4 gap-2 mx-auto">
                    <li className="mr-1 py-2 px-4 bg-transparent hover:bg-[rgba(16,185,129,0.2)] rounded border-2 border-emerald-300/[0.8]">
                        <a href="/resume" className="text-gray-100 font-mono hover:text-emerald-300/[0.8]">
                        Resume
                        </a>
                    </li>
                    <li className="mr-1 py-2 px-4 bg-transparent hover:bg-[rgba(16,185,129,0.2)] rounded border-2 border-emerald-300/[0.8]">
                        <a href="/" className="text-gray-100 font-mono hover:text-emerald-300/[0.8]">
                        About
                        </a>
                    </li>
                    <li className="mr-1 py-2 px-4 bg-transparent hover:bg-[rgba(16,185,129,0.2)]  rounded border-2 border-emerald-300/[0.8]">
                        <a href="#" className="text-gray-100 font-mono hover:text-emerald-300/[0.8]">
                        Contact
                        </a>
                    </li>
                </ul>
            </div>
        </CardBody>
        </CardContainer>
    </div>
  );
};

export default ImageCard;