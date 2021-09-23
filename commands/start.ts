import * as Colors from "https://deno.land/std@0.96.0/fmt/colors.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const getEnvOrThrowError = (env: string) => {
  const x = Deno.env.get(env);
  if (!x) {
    throw new Error(`missing env ${env}`);
  }

  return x;
};

export const startCommand = async (prefix: string) => {
  const ids_query =
    "SELECT [System.Id] FROM workitems WHERE [System.TeamProject] = @project AND [System.State] <> 'Ready for test' AND [System.State] <> 'Parked' AND [System.State] <> 'Removed' AND [System.State] <> 'Tested OK' AND [System.State] <> 'Done' AND [System.AssignedTo] = @me";

  const organizationName = getEnvOrThrowError("AZURE_DEVOPS_ORG");
  const projectName = getEnvOrThrowError("AZURE_DEVOPS_PROJECT");
  const username = getEnvOrThrowError("AZURE_DEVOPS_USERNAME");
  const password = getEnvOrThrowError("AZURE_DEVOPS_READ_WORK_ITEMS_TOKEN");

  const Authorization = "Basic " + btoa(username + ":" + password);

  const idsResponse = await fetch(
    `https://dev.azure.com/${organizationName}/${projectName}/_apis/wit/wiql?api-version=6.0`,
    {
      body: JSON.stringify({ query: ids_query }),
      headers: {
        "Content-type": "application/json",
        Authorization,
      },
      method: "POST",
    }
  ).then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)));

  const ids = idsResponse.workItems.map((wi: any) => wi.id);

  if (ids.length === 0) {
    throw new Error("No assigned workitems");
  }

  const workItemsResponse = await fetch(
    `https://dev.azure.com/${organizationName}/_apis/wit/workitems?ids=${ids.join(
      ","
    )}&api-version=6.0`,
    {
      headers: {
        "Content-type": "application/json",
        Authorization,
      },
    }
  ).then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)));

  function formatWorkItemType(workItemType: string): string {
    switch (workItemType) {
      case "Bug":
        return Colors.red(workItemType);
      case "Task":
        return Colors.yellow(workItemType);
      case "Product Backlog Item":
        return Colors.blue("PBI");
      default:
        return workItemType;
    }
  }

  function getDescription(description: string | undefined) {
    if (description) {
      return (
        new DOMParser().parseFromString(description, "text/html")
          ?.textContent ?? ""
      );
    } else {
      return "";
    }
  }

  const workItems = workItemsResponse.value.map((v: any) => {
    const id = v.id;
    const title = v.fields["System.Title"];
    const state = v.fields["System.State"];
    const description = getDescription(v.fields["System.Description"]);
    const workItemType = v.fields["System.WorkItemType"];

    const fields = [
      `${id} ${title}`,
      formatWorkItemType(workItemType),
      state,
      description,
    ];

    return fields.join("\t");
  });

  const p = Deno.run({
    cmd: [
      "fzf",
      `--with-nth=1`,
      `--delimiter=\\t`,
      `--preview=printf "Type: %s\nState: %s\nDescription:\n%s\n" {2} {3} {4}`,
      "--preview-window=bottom:wrap",
    ],
    stdin: "piped",
    stdout: "piped",
  });

  await p.stdin?.write(new TextEncoder().encode(workItems.join("\n")));
  p.stdin?.close();

  const status = await p.status();

  if (!status.success) {
    Deno.exit(status.code);
  }

  const output = new TextDecoder().decode(await p.output());

  const [selectedWorkItem] = output.split("\t");

  let s = selectedWorkItem
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[\W_]/g, " ")
    .trim()
    .replace(/\s+/g, "-");

  s = `${prefix}/${s}`;

  if (s.length > 100) {
    s = s.substr(0, 100);
    const lastDash = s.lastIndexOf("-");
    s = s.substring(0, lastDash);
  }
  console.log(s);

  const gitCheckout = Deno.run({
    cmd: ["git", "checkout", "-b", s],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const status2 = await gitCheckout.status();

  if (!status2.success) {
    Deno.exit(status2.code);
  }

  const gitSetMetadata = Deno.run({
    cmd: ["git", "config", `branch.${s}.description`, selectedWorkItem],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code: c2 } = await gitSetMetadata.status();

  Deno.exit(c2);
};
