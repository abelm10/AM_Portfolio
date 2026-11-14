"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { cssTokens, onThemeChange } from "@/lib/dom";
import {
  nameKey,
  NameSchema,
  PinSchema,
  type BoardPlayer,
  type ListPlayer,
  type ScoreResult,
  type Session,
} from "@/lib/leaderboard/schemas";

// Ranked mode: a full-screen arena with fixed rules, so every laptop plays the same game.
// The signed-in player lives only in this component's memory; closing the arena forgets them.

const AW = 760; // logical arena size, scaled to fit
const AH = 300;
const BUGS = 7;
const SPEED = 80; // logical px per second
const RESPAWN = 0.6; // seconds
const P = 5; // sprite scale
const HIT = 8; // hit-box margin, logical px
const ROUND_SECS = 60;
const COUNTDOWN: readonly (readonly [string, number])[] = [
  ["3", 750],
  ["2", 750],
  ["1", 750],
  ["GO", 450],
];
const SPRITE = ["0100010", "0011100", "1111111", "0111110", "1010101"];
const SW = SPRITE[0].length * P;
const SH = SPRITE.length * P;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

type Screen = "who" | "pin" | "new" | "ready" | "play" | "results" | "board";
type Bug = { x: number; y: number; vx: number; vy: number; dead: number };
type Top = { name: string; best: number } | null;
type Result = { score: number; data: ScoreResult | null; error: string };

const CRUMBS: Record<Screen, string> = {
  who: "who's playing",
  pin: "check-in",
  new: "new player",
  ready: "get ready",
  play: "playing",
  results: "results",
  board: "leaderboard",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const niceDate = (d: string | null) => (d ? `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]}` : "—");

type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

async function api<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(
      url,
      body === undefined
        ? { cache: "no-store" }
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
    const json = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: json as T };
    return { ok: false, status: res.status, error: json?.error ?? "Something went wrong. Try again." };
  } catch {
    return { ok: false, status: 0, error: "Couldn't reach the server. Check your connection." };
  }
}

const fetchPlayers = () => api<{ players: ListPlayer[] }>("/api/leaderboard/players");
const fetchBoard = () => api<{ players: BoardPlayer[] }>("/api/leaderboard");

function spawn(bug: Bug = { x: 0, y: 0, vx: 0, vy: 0, dead: 0 }): Bug {
  bug.x = rnd(12, AW - SW - 12);
  bug.y = rnd(12, AH - SH - 12);
  const a = rnd(0, Math.PI * 2);
  bug.vx = Math.cos(a) * SPEED;
  bug.vy = Math.sin(a) * SPEED;
  bug.dead = 0;
  return bug;
}

export default function RankedArena({
  start,
  onClose,
  onSaved,
}: {
  start: "who" | "board";
  onClose: () => void;
  /** A round was saved: the footer's #1 line may have changed. */
  onSaved: () => void;
}) {
  const [screen, setScreen] = useState<Screen>(start);
  const prevScreen = useRef<Screen>("who");
  const [boardFromFooter, setBoardFromFooter] = useState(start === "board");

  // Signed-in player: memory only. The token is in a ref so refreshing it never restarts a round.
  const [playerName, setPlayerName] = useState<string | null>(null);
  const token = useRef<string | null>(null);
  const [picked, setPicked] = useState("");

  const [players, setPlayers] = useState<ListPlayer[] | null>(null);
  const [board, setBoard] = useState<BoardPlayer[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [top, setTop] = useState<Top | undefined>(undefined);

  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [newErr, setNewErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [hud, setHud] = useState({ time: ROUND_SECS, score: 0 });
  const [count, setCount] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const alive = useRef(true);
  const pitRef = useRef<HTMLCanvasElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  // --- loading -------------------------------------------------------------------------------

  const applyPlayers = useCallback((res: ApiResult<{ players: ListPlayer[] }>) => {
    if (!alive.current) return;
    if (res.ok) {
      setPlayers(res.data.players);
      setLoadError("");
    } else setLoadError("Couldn't load players. Close and try again.");
  }, []);

  const applyBoard = useCallback((res: ApiResult<{ players: BoardPlayer[] }>) => {
    if (!alive.current) return;
    if (res.ok) {
      const first = res.data.players[0];
      setBoard(res.data.players);
      setTop(first ? { name: first.name, best: first.best } : null);
      setLoadError("");
    } else setLoadError("Couldn't load the leaderboard. Close and try again.");
  }, []);

  const loadPlayers = useCallback(() => void fetchPlayers().then(applyPlayers), [applyPlayers]);
  const loadBoard = useCallback(() => void fetchBoard().then(applyBoard), [applyBoard]);

  const go = useCallback(
    (name: Screen) => {
      if (name !== "board") prevScreen.current = name;
      if (name === "who") loadPlayers();
      if (name === "board" || name === "ready") loadBoard();
      if (name === "pin") {
        setPin("");
        setPinErr("");
      }
      if (name === "new") {
        setNewName("");
        setNewPin("");
        setNewPin2("");
        setNewErr("");
      }
      setScreen(name);
    },
    [loadBoard, loadPlayers],
  );

  // First load, body scroll lock, Esc to close.
  useEffect(() => {
    alive.current = true;
    if (start === "board") void fetchBoard().then(applyBoard);
    else void fetchPlayers().then(applyPlayers);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      alive.current = false;
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [start, onClose, applyBoard, applyPlayers]);

  // Focus the screen's main control.
  useEffect(() => {
    if (screen === "pin") pinRef.current?.focus();
    else if (screen === "new") newNameRef.current?.focus();
    else if (screen === "ready") startRef.current?.focus();
    else if (screen === "results") againRef.current?.focus();
    else if (screen !== "play") boxRef.current?.querySelector<HTMLElement>(".screen button")?.focus();
  }, [screen]);

  // --- sign-in -------------------------------------------------------------------------------

  function signIn(session: Session) {
    setPlayerName(session.name);
    token.current = session.token;
    go("ready");
  }

  function forget() {
    setPlayerName(null);
    token.current = null;
  }

  async function submitPin(event: FormEvent) {
    event.preventDefault();
    const value = pin.trim();
    if (!/^\d{4}$/.test(value)) {
      setPinErr("Enter your 4-digit PIN.");
      return;
    }
    setBusy(true);
    const res = await api<Session>("/api/leaderboard/verify", { name: picked, pin: value });
    if (!alive.current) return;
    setBusy(false);
    if (res.ok) return signIn(res.data);
    setPinErr(res.status === 401 ? "That PIN doesn't match. Try again." : res.error);
    pinRef.current?.select();
  }

  async function submitNew(event: FormEvent) {
    event.preventDefault();
    const name = NameSchema.safeParse(newName);
    if (!name.success) return setNewErr(name.error.issues[0]?.message ?? "Check the name.");
    if (players?.some((p) => nameKey(p.name) === nameKey(name.data))) {
      return setNewErr(`"${name.data}" is taken. Pick another, or tap your name instead.`);
    }
    if (!PinSchema.safeParse(newPin.trim()).success) return setNewErr("PIN must be exactly 4 digits.");
    if (newPin.trim() !== newPin2.trim()) return setNewErr("The two PINs don't match.");
    setBusy(true);
    const res = await api<Session>("/api/leaderboard/players", { name: name.data, pin: newPin.trim() });
    if (!alive.current) return;
    setBusy(false);
    if (res.ok) return signIn(res.data);
    setNewErr(res.error);
  }

  // --- the round -------------------------------------------------------------------------------

  function startRound() {
    setHud({ time: ROUND_SECS, score: 0 });
    setCount(COUNTDOWN[0][0]);
    go("play");
  }

  const roundOver = useCallback(
    async (score: number) => {
      setResult({ score, data: null, error: "" });
      go("results");
      const res = await api<ScoreResult>("/api/leaderboard/score", { token: token.current, score });
      if (res.ok) {
        token.current = res.data.token;
        onSavedRef.current();
      }
      if (!alive.current) return;
      setResult(res.ok ? { score, data: res.data, error: "" } : { score, data: null, error: res.error });
    },
    [go],
  );

  useEffect(() => {
    if (screen !== "play") return;
    const cv = pitRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const readColors = () => cssTokens(["--bg", "--fg", "--accent", "--line"] as const);
    let colors = readColors();
    const bugs = Array.from({ length: BUGS }, () => spawn());
    let score = 0;
    let live = false;
    let endAt = 0;
    let raf = 0;
    let lastT = performance.now();
    let legT = 0;
    let shownSecs = ROUND_SECS;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    function size() {
      if (!cv || !ctx) return;
      const rect = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(rect.width * dpr));
      cv.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(cv.width / AW, 0, 0, cv.height / AH, 0, 0);
    }

    function draw() {
      if (!ctx) return;
      const { "--bg": bg, "--fg": fg, "--accent": accent, "--line": line } = colors;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, AW, AH);
      ctx.fillStyle = line;
      for (let x = 20; x < AW; x += 40) for (let y = 20; y < AH; y += 40) ctx.fillRect(x, y, 2, 2);
      const leg = Math.floor(legT * 6) % 2;
      for (const bug of bugs) {
        if (bug.dead) {
          ctx.globalAlpha = Math.max(0, 1 - bug.dead / RESPAWN);
          ctx.fillStyle = accent;
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            const d = 6 + bug.dead * 60;
            ctx.fillRect(bug.x + SW / 2 + Math.cos(a) * d, bug.y + SH / 2 + Math.sin(a) * d, P, P);
          }
          ctx.globalAlpha = 1;
          continue;
        }
        ctx.fillStyle = fg;
        SPRITE.forEach((row, ry) => {
          for (let rx = 0; rx < row.length; rx++) {
            let on = row[rx] === "1";
            if (ry === 4 && leg) on = row[rx] !== "1" && rx > 0 && rx < 6;
            if (on) ctx.fillRect(Math.round(bug.x) + rx * P, Math.round(bug.y) + ry * P, P, P);
          }
        });
      }
    }

    function step(t: number) {
      const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000));
      lastT = t;
      legT += dt;
      if (live) {
        for (const bug of bugs) {
          if (bug.dead) {
            bug.dead += dt;
            if (bug.dead > RESPAWN) spawn(bug);
            continue;
          }
          bug.x += bug.vx * dt;
          bug.y += bug.vy * dt;
          if (bug.x < 2) { bug.x = 2; bug.vx *= -1; }
          if (bug.x > AW - SW - 2) { bug.x = AW - SW - 2; bug.vx *= -1; }
          if (bug.y < 2) { bug.y = 2; bug.vy *= -1; }
          if (bug.y > AH - SH - 2) { bug.y = AH - SH - 2; bug.vy *= -1; }
          if (Math.random() < 0.6 * dt) {
            const a = Math.atan2(bug.vy, bug.vx) + rnd(-1, 1);
            bug.vx = Math.cos(a) * SPEED;
            bug.vy = Math.sin(a) * SPEED;
          }
        }
        const left = Math.max(0, endAt - performance.now());
        const secs = Math.ceil(left / 1000);
        if (secs !== shownSecs) {
          shownSecs = secs;
          setHud((h) => ({ ...h, time: secs }));
        }
        if (left <= 0) {
          live = false;
          draw();
          void roundOver(score);
          return;
        }
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    // 3, 2, 1 (750 ms each), GO (450 ms), then the clock starts.
    let index = 0;
    const tick = () => {
      index++;
      if (index < COUNTDOWN.length) {
        setCount(COUNTDOWN[index][0]);
        const timer = setTimeout(tick, COUNTDOWN[index][1]);
        timers.add(timer);
      } else {
        setCount(null);
        live = true;
        endAt = performance.now() + ROUND_SECS * 1000;
      }
    };
    timers.add(setTimeout(tick, COUNTDOWN[0][1]));

    function onPointerDown(event: PointerEvent) {
      if (!live || !cv) return;
      const rect = cv.getBoundingClientRect();
      const x = ((event.clientX - rect.left) * AW) / rect.width;
      const y = ((event.clientY - rect.top) * AH) / rect.height;
      const hit = bugs.find(
        (b) => !b.dead && x > b.x - HIT && x < b.x + SW + HIT && y > b.y - HIT && y < b.y + SH + HIT,
      );
      if (!hit) return;
      hit.dead = 0.0001;
      score++;
      setHud((h) => ({ ...h, score }));
    }

    size();
    draw();
    raf = requestAnimationFrame(step);
    const resizeObserver = new ResizeObserver(() => {
      size();
      draw();
    });
    resizeObserver.observe(cv);
    cv.addEventListener("pointerdown", onPointerDown);
    const stopTheme = onThemeChange(() => {
      colors = readColors();
      draw();
    });

    // Leaving the screen (✕, Esc, unmount) stops the round. Nothing is saved unless it finished.
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      resizeObserver.disconnect();
      cv.removeEventListener("pointerdown", onPointerDown);
      stopTheme();
    };
  }, [screen, roundOver]);

  // --- render --------------------------------------------------------------------------------

  const toBoard = () => {
    setBoardFromFooter(false);
    go("board");
  };
  const me = playerName ? nameKey(playerName) : null;
  const sortedPlayers = players ?? [];

  return createPortal(
    <div className="arena" role="dialog" aria-modal="true" aria-labelledby="arenaTitle">
      <div className="arena-box" ref={boxRef}>
        <div className="arena-head">
          <span id="arenaTitle">
            <b>bug-bash/</b> ranked · <span>{CRUMBS[screen]}</span>
          </span>
          <button className="close" type="button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        {screen === "who" && (
          <section className="screen">
            <p className="kicker">pass the laptop · tap your name</p>
            <h2>
              who&apos;s-playing<em>?</em>
            </h2>
            {loadError && <p className="err" role="alert">{loadError}</p>}
            <div className="players">
              {sortedPlayers.map((p) => (
                <button
                  key={p.name}
                  className="pchip"
                  type="button"
                  onClick={() => {
                    setPicked(p.name);
                    go("pin");
                  }}
                >
                  <b>{p.name}</b>
                  <span>{p.games ? `best ${p.best}` : "no rounds yet"}</span>
                </button>
              ))}
              <button className="pchip add" type="button" onClick={() => go("new")}>
                <b>+ New player</b>
                <span>name + PIN</span>
              </button>
            </div>
            <div className="row-actions">
              <button className="linkish" type="button" onClick={toBoard}>
                view leaderboard
              </button>
            </div>
          </section>
        )}

        {screen === "pin" && (
          <section className="screen">
            <p className="kicker">quick check before you play</p>
            <h2>
              hey <em>{picked}</em>, your PIN?
            </h2>
            <form onSubmit={submitPin} noValidate>
              <div className="field">
                <label htmlFor="pinIn">4-digit PIN</label>
                <input
                  ref={pinRef}
                  className="pin"
                  id="pinIn"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>
              <p className="err" role="alert">{pinErr}</p>
              <div className="row-actions">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Continue
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => go("who")}>
                  Not me
                </button>
              </div>
            </form>
          </section>
        )}

        {screen === "new" && (
          <section className="screen">
            <p className="kicker">first time? takes 10 seconds</p>
            <h2>new-player/</h2>
            <form onSubmit={submitNew} noValidate>
              <div className="field">
                <label htmlFor="newName">name (shown on the leaderboard)</label>
                <input
                  ref={newNameRef}
                  id="newName"
                  type="text"
                  maxLength={16}
                  autoComplete="off"
                  spellCheck={false}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="newPin">pick a 4-digit PIN</label>
                <input
                  className="pin"
                  id="newPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="newPin2">type it again</label>
                <input
                  className="pin"
                  id="newPin2"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  value={newPin2}
                  onChange={(e) => setNewPin2(e.target.value)}
                />
              </div>
              <p className="err" role="alert">{newErr}</p>
              <div className="row-actions">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Create and play
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => go("who")}>
                  Back
                </button>
              </div>
            </form>
          </section>
        )}

        {screen === "ready" && (
          <section className="screen">
            <p className="kicker">ranked round</p>
            <h2>
              ready, <em>{playerName}</em>?
            </h2>
            <ul className="rules">
              <li><span>time</span><span>{ROUND_SECS} seconds</span></li>
              <li><span>goal</span><span>Squash as many bugs as you can</span></li>
              <li><span>fair play</span><span>{BUGS} bugs, same arena and speed for everyone</span></li>
              <li><span>counts</span><span>Your best round goes on the leaderboard</span></li>
            </ul>
            <div className="row-actions">
              <button ref={startRef} className="btn btn-primary btn-big" type="button" onClick={startRound}>
                Start ▶
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => go("who")}>
                Switch player
              </button>
            </div>
          </section>
        )}

        {screen === "play" && (
          <section>
            <div className="hud">
              <div><span className="lab">player</span><span className="val who">{playerName}</span></div>
              <div><span className="lab">time</span><span className={`val${hud.time <= 10 ? " low" : ""}`}>{hud.time}</span></div>
              <div><span className="lab">squashed</span><span className="val">{hud.score}</span></div>
            </div>
            <div className="pit">
              <canvas ref={pitRef} aria-label="Ranked arena: click the bugs" />
              <div className="count" aria-live="assertive" hidden={count === null}>
                {count}
              </div>
            </div>
            <div className="play-foot">
              <span>
                {top === undefined ? "#1 to beat: —" : top ? `#1 to beat: ${top.name} · ${top.best}` : "#1 to beat: nobody yet"}
              </span>
              <span>✕ ends the round without saving</span>
            </div>
          </section>
        )}

        {screen === "results" && result && (
          <section className="screen">
            <p className="kicker">round over · {playerName}</p>
            <p className="score-big">
              <b>{result.score}</b>
              <span>bugs in {ROUND_SECS} s</span>
            </p>
            <Banner data={result.data} me={me} />
            <div className="facts" aria-live="polite">
              {result.data ? (
                <>
                  <span>rank <b>#{result.data.rank}</b> of {result.data.total}</span>
                  <span>your best <b>{result.data.best}</b></span>
                  <span>games <b>{result.data.games}</b></span>
                  {result.data.rank !== 1 && result.data.previousTop && (
                    <span>#1 is <b>{result.data.previousTop.name}</b> at <b>{result.data.previousTop.best}</b></span>
                  )}
                </>
              ) : result.error ? (
                <span className="err">{result.error}</span>
              ) : (
                <span>saving…</span>
              )}
            </div>
            <div className="row-actions">
              <button ref={againRef} className="btn btn-primary btn-big" type="button" onClick={() => go("ready")}>
                Play again
              </button>
              <button
                className="btn btn-ghost btn-big"
                type="button"
                onClick={() => {
                  forget();
                  go("who");
                }}
              >
                Next player
              </button>
              <button className="linkish" type="button" onClick={toBoard}>
                leaderboard
              </button>
            </div>
          </section>
        )}

        {screen === "board" && (
          <section className="screen">
            <p className="kicker">best round per player · {board?.length ?? 0} players</p>
            <h2>leaderboard/</h2>
            {loadError && <p className="err" role="alert">{loadError}</p>}
            <div className="lb-wrap">
              <table className="lb">
                <thead>
                  <tr>
                    <th>rank</th>
                    <th>player</th>
                    <th className="num">best</th>
                    <th className="num">games</th>
                    <th>last played</th>
                  </tr>
                </thead>
                <tbody>
                  {board && board.length > 0 ? (
                    board.map((p, i) => {
                      const mine = me !== null && nameKey(p.name) === me;
                      return (
                        <tr key={p.name} className={mine ? "me" : undefined}>
                          <td className="r">{i === 0 ? <span className="crown">#1</span> : `#${i + 1}`}</td>
                          <td className="n">
                            {p.name}
                            {mine && <span className="you">you</span>}
                          </td>
                          <td className="s num">{p.best}</td>
                          <td className="m num">{p.games}</td>
                          <td className="m">{niceDate(p.last)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="m">
                        {board ? "// no rounds yet. be the first." : "loading…"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="row-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setBoardFromFooter(false);
                  go(playerName ? "ready" : "who");
                }}
              >
                {playerName ? "Play again ▶" : "Set a record ▶"}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => (boardFromFooter ? onClose() : go(prevScreen.current))}
              >
                Back
              </button>
            </div>
          </section>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Banner({ data, me }: { data: ScoreResult | null; me: string | null }) {
  if (!data) return null;
  const prev = data.previousTop;
  if (data.newTop && prev && nameKey(prev.name) !== me) {
    return (
      <div className="banner top">
        <span className="crown">#1</span>New #1! You beat {prev.name}&apos;s {prev.best}.
      </div>
    );
  }
  if (data.newTop) {
    return (
      <div className="banner top">
        <span className="crown">#1</span>New record. Still #1.
      </div>
    );
  }
  if (data.personalBest && data.previousBest > 0) {
    return <div className="banner pb">New personal best, up from {data.previousBest}.</div>;
  }
  if (data.personalBest) return <div className="banner pb">First round on the board.</div>;
  return null;
}
