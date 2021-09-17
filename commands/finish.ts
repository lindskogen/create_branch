export const finishCommand = async (args: string[]) => {
  const p = Deno.run({
    cmd: ["git", "notes", "show"],
    stdin: "inherit",
    stdout: "piped",
    stderr: "inherit",
  });

  const status = await p.status();

  if (!status.success) {
    Deno.exit(status.code);
  }

  const output = new TextDecoder().decode(await p.output());

  const data = output.trim();

  const [id, ...rest] = data.split(" ");

  const description = rest.join(" ");

  const p2 = Deno.run({
    cmd: [
      "gh",
      "pr",
      "create",
      "-t",
      `${description} (fixes AB#${id})`,
      ...args,
    ],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code: c2 } = await p2.status();

  Deno.exit(c2);
};
