import Head from "next/head";
import Navbar from "../Home/nav";
import Footer from "../Footer/footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <Head>
        <title>My Portfolio</title>
      </Head>
      <main>
        <div className="justify-center bg-slate-900 dark:bg-black min-w-100vw min-h-100vh">
          <Navbar />
          {children}
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Layout;
