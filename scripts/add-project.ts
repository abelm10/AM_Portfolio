// Interactive helper: `npm run add-project` asks for each field, validates the
// answers with the same ProjectSchema the build uses, and writes
// content/projects/<slug>.md. Runs on Node's built-in TypeScript support.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import matter from "gray-matter";
import { z } from "zod";
import { PROJECT_STATUSES, ProjectSchema } from "../lib/projects.ts";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const lines = rl[Symbol.asyncIterator]();

// Reads one answer. Works for a terminal and for piped input alike.
async function ask(question: string, fallback = ""): Promise<string> {
  const hint = fallback ? ` (${fallback})` : "";
  process.stdout.write(`${question}${hint}: `);
  const next = await lines.next();
  if (next.done) throw new Error("Input ended before all questions were answered.");
  if (!process.stdin.isTTY) process.stdout.write(`${next.value}\n`);
  return next.value.trim() || fallback;
}

async function askRequired(question: string): Promise<string> {
  for (;;) {
    const answer = await ask(question);
    if (answer) return answer;
    console.log("  This one is required.");
  }
}

async function askList(question: string): Promise<string[]> {
  const answer = await ask(`${question}, comma-separated`);
  return answer
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// Asks repeatedly until a blank answer, e.g. "point 1", "point 2" ...
async function askMany(noun: string): Promise<string[]> {
  const items: string[] = [];
  for (;;) {
    const answer = await ask(`${noun} ${items.length + 1} (blank to finish)`);
    if (!answer) return items;
    items.push(answer);
  }
}

async function askUrl(question: string): Promise<string> {
  for (;;) {
    const answer = await askRequired(question);
    if (z.url().safeParse(answer).success) return answer;
    console.log("  That doesn't look like a full URL (https://...).");
  }
}

function slugify(title: string): string {
  return title
    .replace(/\/+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function nextOrder(): number {
  const orders = fs
    .readdirSync(PROJECTS_DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) => matter(fs.readFileSync(path.join(PROJECTS_DIR, file), "utf8")).data.order)
    .filter((order): order is number => typeof order === "number");
  return orders.length ? Math.max(...orders) + 1 : 1;
}

async function main() {
  console.log("New project for content/projects/. Blank answers skip optional fields.\n");

  let title = await askRequired('title, e.g. "fakewave"');
  if (!title.endsWith("/")) title += "/";

  const slug = slugify(title);
  const file = path.join(PROJECTS_DIR, `${slug}.md`);
  if (!slug) throw new Error("The title needs at least one letter or number.");
  if (fs.existsSync(file)) throw new Error(`content/projects/${slug}.md already exists.`);

  console.log(PROJECT_STATUSES.map((status, i) => `  ${i + 1}. ${status}`).join("\n"));
  let status: (typeof PROJECT_STATUSES)[number] | undefined;
  while (!status) {
    const answer = await askRequired("status, number or name");
    status = PROJECT_STATUSES[Number(answer) - 1] ?? PROJECT_STATUSES.find((s) => s === answer);
    if (!status) console.log(`  Pick 1-${PROJECT_STATUSES.length}.`);
  }

  const tags = await askList("tags (ml, data, web, software ...)");
  const blurb = await askRequired("blurb, one or two sentences");

  const metricValue = await ask('headline metric value, e.g. "92%" (blank to skip)');
  const metric = metricValue
    ? { value: metricValue, label: await askRequired("metric label, what the number means") }
    : undefined;

  const points = await askMany("point");
  const stack = await askList("stack");

  const links: { label: string; url: string; primary?: boolean }[] = [];
  for (;;) {
    const label = await ask(`link ${links.length + 1} label, e.g. "Repo" (blank to finish)`);
    if (!label) break;
    const url = await askUrl("  url");
    const primary = await ask("  solid green button? y/n", links.length === 0 ? "y" : "n");
    links.push({ label, url, ...(primary.toLowerCase().startsWith("y") ? { primary: true } : {}) });
  }

  const order = Number(await ask("order, lower comes first", String(nextOrder())));

  const project = {
    title,
    status,
    tags,
    blurb,
    ...(metric ? { metric } : {}),
    points,
    stack,
    links,
    ...(Number.isFinite(order) ? { order } : {}),
  };

  const result = ProjectSchema.safeParse(project);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Not saved, the project is invalid:\n${issues}`);
  }

  fs.writeFileSync(file, matter.stringify("", result.data));
  console.log(`\nWrote content/projects/${slug}.md. Run \`npm run dev\` to see it on the page.`);
}

main()
  .catch((error: unknown) => {
    console.error(`\n${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
