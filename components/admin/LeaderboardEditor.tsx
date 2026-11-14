"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  addPlayerAction,
  deletePlayerAction,
  resetPinAction,
  setBestAction,
  type LeaderboardResult,
} from "@/app/admin/(panel)/leaderboard/actions";
import type { AdminPlayer } from "@/lib/leaderboard/store";
import { ConfirmDelete, Field, fieldProps } from "./ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const niceDate = (d: string | null) =>
  d ? `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}` : "—";

/** Leaderboard admin: the players table, per-row actions and "Add player". Saves go straight to the store. */
export default function LeaderboardEditor({ initial }: { initial: AdminPlayer[] }) {
  const [players, setPlayers] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function run(action: () => Promise<LeaderboardResult>, onSuccess?: () => void) {
    startTransition(async () => {
      let result: LeaderboardResult;
      try {
        result = await action();
      } catch {
        result = { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
      }
      if (result.ok) {
        setPlayers(result.players);
        setStatus({ ok: true, text: "✓ saved" });
        setFieldErrors({});
        onSuccess?.();
      } else {
        setStatus({ ok: false, text: result.error });
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <>
      <section className="admin-section">
        <h2>players ({players.length})</h2>
        <StatusLine status={status} pending={pending} />
      </section>
      <div className="lb-wrap lb-admin">
        <table className="lb">
          <thead>
            <tr>
              <th>player</th>
              <th className="num">best</th>
              <th className="num">games</th>
              <th>last played</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan={5} className="m">
                  {"// no players yet. add one below."}
                </td>
              </tr>
            ) : (
              players.map((p) => <PlayerRow key={p.key} player={p} pending={pending} run={run} />)
            )}
          </tbody>
        </table>
      </div>
      <AddPlayer pending={pending} run={run} fieldErrors={fieldErrors} />
    </>
  );
}

function StatusLine({ status, pending }: { status: { ok: boolean; text: string } | null; pending: boolean }) {
  if (pending) return <p className="status status-muted" role="status">saving…</p>;
  if (!status) return <p className="status status-muted" role="status" />;
  return (
    <p className={`status ${status.ok ? "ok" : "err"}`} role={status.ok ? "status" : "alert"}>
      {status.text}
    </p>
  );
}

type Run = (action: () => Promise<LeaderboardResult>, onSuccess?: () => void) => void;

function PlayerRow({ player, pending, run }: { player: AdminPlayer; pending: boolean; run: Run }) {
  const [mode, setMode] = useState<"idle" | "best" | "pin">("idle");
  const [best, setBest] = useState(String(player.best));
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const id = `p-${player.key.replace(/[^a-z0-9]/g, "_")}`;

  function saveBest(event: FormEvent) {
    event.preventDefault();
    run(() => setBestAction(player.key, best.trim() === "" ? Number.NaN : best), () => setMode("idle"));
  }

  function savePin(event: FormEvent) {
    event.preventDefault();
    run(
      () => resetPinAction(player.key, { pin, pin2 }),
      () => {
        setPin("");
        setPin2("");
        setMode("idle");
      },
    );
  }

  return (
    <tr>
      <td className="n">{player.name}</td>
      <td className="s num">{player.best}</td>
      <td className="m num">{player.games}</td>
      <td className="m">{niceDate(player.last)}</td>
      <td>
        <div className="lb-actions">
          {mode === "best" && (
            <form className="lb-inline" onSubmit={saveBest}>
              <label className="sr-only" htmlFor={`${id}-best`}>
                New best for {player.name}
              </label>
              <input
                className="input"
                id={`${id}-best`}
                type="number"
                min={0}
                max={500}
                step={1}
                value={best}
                onChange={(e) => setBest(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
                Save best
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setMode("idle")}>
                Cancel
              </button>
            </form>
          )}
          {mode === "pin" && (
            <form className="lb-inline" onSubmit={savePin}>
              <label className="sr-only" htmlFor={`${id}-pin`}>
                New PIN for {player.name}
              </label>
              <input
                className="input"
                id={`${id}-pin`}
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                placeholder="new PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <label className="sr-only" htmlFor={`${id}-pin2`}>
                New PIN again
              </label>
              <input
                className="input"
                id={`${id}-pin2`}
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                placeholder="again"
                value={pin2}
                onChange={(e) => setPin2(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
                Save PIN
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setMode("idle")}>
                Cancel
              </button>
            </form>
          )}
          {mode === "idle" && (
            <>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => {
                  setBest(String(player.best));
                  setMode("best");
                }}
              >
                Set best
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setMode("pin")}>
                Reset PIN
              </button>
              <ConfirmDelete what={player.name} disabled={pending} onConfirm={() => run(() => deletePlayerAction(player.key))} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function AddPlayer({ pending, run, fieldErrors }: { pending: boolean; run: Run; fieldErrors: Record<string, string> }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [best, setBest] = useState("0");

  function submit(event: FormEvent) {
    event.preventDefault();
    run(
      () => addPlayerAction({ name, pin, pin2, best: best.trim() === "" ? Number.NaN : best }),
      () => {
        setName("");
        setPin("");
        setPin2("");
        setBest("0");
      },
    );
  }

  return (
    <form className="admin-section" onSubmit={submit} noValidate>
      <h2>add player</h2>
      <div className="field-row">
        <Field id="add-name" label="name (2–16 characters)" error={fieldErrors.name}>
          <input
            className="input"
            {...fieldProps("add-name", fieldErrors.name)}
            maxLength={16}
            autoComplete="off"
            spellCheck={false}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field id="add-best" label="starting best (0–500)" error={fieldErrors.best}>
          <input
            className="input"
            {...fieldProps("add-best", fieldErrors.best)}
            type="number"
            min={0}
            max={500}
            step={1}
            value={best}
            onChange={(e) => setBest(e.target.value)}
          />
        </Field>
      </div>
      <div className="field-row">
        <Field id="add-pin" label="4-digit PIN" error={fieldErrors.pin}>
          <input
            className="input"
            {...fieldProps("add-pin", fieldErrors.pin)}
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </Field>
        <Field id="add-pin2" label="PIN again" error={fieldErrors.pin2}>
          <input
            className="input"
            {...fieldProps("add-pin2", fieldErrors.pin2)}
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            value={pin2}
            onChange={(e) => setPin2(e.target.value)}
          />
        </Field>
      </div>
      <p className="hint" style={{ margin: 0 }}>
        A starting best above 0 counts as one game played today, so the player is ranked straight away.
      </p>
      <div>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          Add player
        </button>
      </div>
    </form>
  );
}
