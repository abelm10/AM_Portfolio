import { getSite } from "@/lib/content";

export default function Footer() {
  const { name } = getSite();

  return (
    <footer className="frame foot" data-trail>
      <div className="bug-head">
        <span>echo &quot;clean-notebooks-later/&quot; &gt;&gt; .todo &nbsp;·&nbsp; click the bugs</span>
        <span>
          bugs squashed: <strong>0</strong>
        </span>
      </div>
      {/* Phase 4: <BugBash /> draws the pixel bugs into this cell. */}
      <div className="bug-wrap" />
      <div className="foot-base">
        <span>© {new Date().getFullYear()} {name}</span>
        <span className="mono">built with HTML, CSS and one canvas too many</span>
      </div>
    </footer>
  );
}
