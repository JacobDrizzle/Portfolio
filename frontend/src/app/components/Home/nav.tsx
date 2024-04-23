import DarkModeToggle from "../layout/theme_switch";

const Navbar  = () => {
  return (
    <div>
    <nav className="flex justify-center">
        <ul className="flex flex-row justify-center bg-slate-900 dark:bg-black py-4 px-24 rounded-3xl border border-[rgba(255,255,255,0.2)]">
          <li className="mr-4">
            <a href="#" className="text-gray-100 hover:text-gray-400">
              Resume
            </a>
          </li>
          <li className="mr-4">
            <a href="#" className="text-gray-100 hover:text-gray-400">
              About
            </a>
          </li>
          <li>
            <a href="#" className="text-gray-100 hover:text-gray-400">
              Contact
            </a>
          </li>
          <li className='ml-4 mt-0.5'>
            <DarkModeToggle />
          </li>
        </ul>
      </nav>
  </div>
  );
};

export default Navbar;