#!/usr/bin/env deno run --quiet --no-check --allow-net=dev.azure.com --allow-run --allow-env=AZURE_DEVOPS_ORG,AZURE_DEVOPS_PROJECT,AZURE_DEVOPS_USERNAME,AZURE_DEVOPS_READ_WORK_ITEMS_TOKEN

import Yargs from "https://deno.land/x/yargs/deno.ts";
import { Arguments } from "https://deno.land/x/yargs/deno-types.ts";
import { startCommand } from "./commands/start.ts";
import { finishCommand } from "./commands/finish.ts";

await Yargs(Deno.args)
  .command(
    "start [prefix]",
    "start working on a task",
    (yargs: any) =>
      yargs.positional("prefix", {
        describe: "branch prefix",
        default: "feature",
      }),
    (argv: Arguments) => {
      startCommand(argv.prefix);
    }
  )
  .command(
    "finish",
    "finish a task",
    () => {},
    () => {
      finishCommand(Deno.args.slice(1));
    }
  )
  .strictCommands()
  .demandCommand(1)
  .parseAsync();
