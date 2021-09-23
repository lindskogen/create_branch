const denoRun = async (cmd: string[]): Promise<string> => {
  const p = Deno.run({
    cmd,
    stdin: "inherit",
    stdout: "piped",
    stderr: "inherit",
  });

  const { success, code } = await p.status();

  if (!success) {
    Deno.exit(code);
  }

  return new TextDecoder().decode(await p.output());
};

export const finishCommand = async (args: string[]) => {
  const s = await denoRun(["git", "branch", "--show-current"]);

  const output = await denoRun(["git", "config", `branch.${s}.description`]);

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
