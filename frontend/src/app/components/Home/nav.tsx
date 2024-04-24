import DarkModeToggle from "../layout/theme_switch";

const Navbar  = () => {
  return (
    <div>
      <nav className="flex justify-center w-full pt-4">
        <ul className="flex flex-row justify-center bg-slate-900 dark:bg-black py-2 px-6 rounded-3xl border border-[rgba(255,255,255,0.2)] hover:border-emerald-400">
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
          <li className='ml-14 mt-1.5'>
            <DarkModeToggle />
          </li>
        </ul>
      </nav>
  </div>
  );
};

export default Navbar;