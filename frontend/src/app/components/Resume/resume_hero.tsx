import Footer from "../Footer/footer";
import Navbar from "../Home/nav";
import ProfileCard from "./projects";
import RepoLayout from "./repo_layout";

const ResumeHero = () => {
  return (
    <div className="pt-4 pb-4 px-12">
      <ProfileCard />
      <RepoLayout />
    </div>
  );
};
export default ResumeHero;
