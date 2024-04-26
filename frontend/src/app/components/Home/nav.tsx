import DarkModeToggle from "../layout/theme_switch";

const Navbar = () => {
  return (
    <div className="md:flex sm:flex-column w-full pt-2 border-b border-[rgba(255,255,255,0.2)] hover:border-emerald-400">
      <nav className="flex items-center w-full">
        <h1 className="text-2xl font-mono font-extrabold text-sky-500 mr-auto">{'>'}JacobDrizzle.Dev</h1>
        <ul className="flex flex-row justify-center content-center bg-slate-900 dark:bg-black py-2 flex-grow mr-64">
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
        <div className="ml-auto">
          <DarkModeToggle />
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
