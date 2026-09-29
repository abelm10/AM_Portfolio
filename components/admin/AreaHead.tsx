import type { ReactNode } from "react";

/** Heading for an admin area, plus the local-mode banner when saves go to disk. */
export default function AreaHead({
  title,
  kicker,
  sub,
  local,
  error,
  children,
}: {
  title: string;
  kicker: string;
  sub?: ReactNode;
  local: boolean;
  error?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="sec-head">
        <div>
          <p className="kicker">{kicker}</p>
          <h1 className="sec-title">{title}</h1>
          {sub && <p className="sec-sub">{sub}</p>}
        </div>
        {children && <div className="admin-toolbar">{children}</div>}
      </div>
      {local && (
        <p className="notice warn">
          Local mode (<code>ADMIN_LOCAL_WRITES=true</code>): saves write to <code>content/</code> on disk. Nothing is committed.
        </p>
      )}
      {error && (
        <p className="notice warn" role="alert" style={{ whiteSpace: "pre-wrap" }}>
          {error}
        </p>
      )}
    </>
  );
}
