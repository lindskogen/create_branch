# cb

Creates a branch with name based on selected task/PBI/bug from Azure Boards.

The maximum branch name length is 100 characters and the name will be cut at the last white space.

# Dependencies

Depends on: `fzf`, `git`, `deno`.

# Usage

```sh
$ cb start [prefix] # (will default to "feature")

$ cb start
# => feature/121212-selected-task-converted-to-branch-name

$ cb start hotfix
# => hotfix/343434-selected-task-converted-to-branch-name


$ cb finish [..args]
# runs gh pr create with appropriate title and appends all following arguments

$ cb finish -r a,b,c --draft
# => gh pr create -t ... -r a,b,c --draft


# Full example flow:

$ cb start
# => feature/121212-selected-task-converted-to-branch-name

$ cb finish -r a,b,c --draft
# => gh pr create -t "Selected task converted to branch name (fixes AB#121212)" -r a,b,c --draft
```

# Compiling (optional)

If desired, compile with:

```sh
deno compile --allow-net=dev.azure.com --allow-run --allow-env=AZURE_DEVOPS_ORG,AZURE_DEVOPS_PROJECT,AZURE_DEVOPS_USERNAME,AZURE_DEVOPS_READ_WORK_ITEMS_TOKEN cb.ts
```
