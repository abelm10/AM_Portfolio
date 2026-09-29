import BugBash from "@/components/BugBash";
import { getSite } from "@/lib/content";

export default function Footer() {
  const { name } = getSite();

  return (
    <footer className="frame foot" data-trail>
      <BugBash />
      <div className="foot-base">
        <span>© {new Date().getFullYear()} {name}</span>
        <span className="mono">built with HTML, CSS and one canvas too many</span>
      </div>
    </footer>
  );
}
