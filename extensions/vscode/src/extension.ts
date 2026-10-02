import * as vscode from "vscode";

interface ToolItem {
  name: string;
  url?: string;
  repo?: string;
  category?: string;
  description: string;
  freeTier?: string;
  language?: string;
}

interface ApiResponse {
  totalCount: number;
  tools: ToolItem[];
}

export function activate(context: vscode.ExtensionContext) {
  // Command 1: Search Tools
  const searchCommand = vscode.commands.registerCommand("devshelf.search", async () => {
    try {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "DevShelf: Fetching 500+ curated developer tools...",
          cancellable: false,
        },
        async () => {
          const res = await fetch("https://devshelf.ritualdev.in/api/v1/tools.json");
          const data = (await res.json()) as ApiResponse;

          const quickPickItems: vscode.QuickPickItem[] = data.tools.map((tool) => ({
            label: `$(symbol-keyword) ${tool.name}`,
            description: tool.category || "Developer Tool",
            detail: tool.description,
          }));

          const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: "Type to search free APIs, AI agents, CLI tools, testing suites...",
            matchOnDescription: true,
            matchOnDetail: true,
          });

          if (selected) {
            const rawName = selected.label.replace("$(symbol-keyword) ", "");
            const tool = data.tools.find((t) => t.name === rawName);
            if (tool) {
              const targetUrl = tool.repo || tool.url || "https://devshelf.ritualdev.in";
              const action = await vscode.window.showInformationMessage(
                `${tool.name}: ${tool.description}`,
                "Open URL",
                "Copy URL",
                "Copy README Badge"
              );

              if (action === "Open URL") {
                vscode.env.openExternal(vscode.Uri.parse(targetUrl));
              } else if (action === "Copy URL") {
                await vscode.env.clipboard.writeText(targetUrl);
                vscode.window.showInformationMessage(`Copied ${targetUrl} to clipboard!`);
              } else if (action === "Copy README Badge") {
                const badge = `[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)`;
                await vscode.env.clipboard.writeText(badge);
                vscode.window.showInformationMessage("Copied DevShelf Markdown badge to clipboard!");
              }
            }
          }
        }
      );
    } catch (err: any) {
      vscode.window.showErrorMessage(`DevShelf Error: ${err.message}`);
    }
  });

  // Command 2: Random Pick
  const randomCommand = vscode.commands.registerCommand("devshelf.random", async () => {
    try {
      const res = await fetch("https://devshelf.ritualdev.in/api/v1/tools.json");
      const data = (await res.json()) as ApiResponse;
      const tool = data.tools[Math.floor(Math.random() * data.tools.length)];

      if (tool) {
        const targetUrl = tool.repo || tool.url || "https://devshelf.ritualdev.in";
        const action = await vscode.window.showInformationMessage(
          `🎲 Random Pick: ${tool.name} (${tool.category || "Tool"})\n${tool.description}`,
          "Open URL",
          "Copy URL"
        );

        if (action === "Open URL") {
          vscode.env.openExternal(vscode.Uri.parse(targetUrl));
        } else if (action === "Copy URL") {
          await vscode.env.clipboard.writeText(targetUrl);
        }
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`DevShelf Error: ${err.message}`);
    }
  });

  context.subscriptions.push(searchCommand, randomCommand);
}

export function deactivate() {}
