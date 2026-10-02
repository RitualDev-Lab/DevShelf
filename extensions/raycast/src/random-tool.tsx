import { Action, ActionPanel, Detail, Icon, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useMemo } from "react";

interface DevShelfItem {
  name: string;
  url?: string;
  repo?: string;
  category?: string;
  description: string;
  freeTier?: string;
  language?: string;
  license?: string;
}

interface ApiResponse {
  totalCount: number;
  tools: DevShelfItem[];
}

export default function RandomTool() {
  const { isLoading, data, revalidate } = useFetch<ApiResponse>("https://devshelf.ritualdev.in/api/v1/tools.json");

  const randomItem = useMemo(() => {
    if (!data || !data.tools || data.tools.length === 0) return null;
    const index = Math.floor(Math.random() * data.tools.length);
    return data.tools[index];
  }, [data]);

  if (isLoading || !randomItem) {
    return <Detail isLoading={true} />;
  }

  const targetUrl = randomItem.repo || randomItem.url || "https://devshelf.ritualdev.in";
  const badgeMarkdown = `[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)`;

  const markdown = `
# 🎲 ${randomItem.name}

${randomItem.description}

---

- **Category**: ${randomItem.category || "General Developer Tool"}
- **Language / Stack**: ${randomItem.language || "Multi-Platform"}
- **License**: ${randomItem.license || "Open Source / Free Tier"}
${randomItem.freeTier ? `- **Free Tier Details**: ${randomItem.freeTier}` : ""}
- **Official URL**: [${targetUrl}](${targetUrl})
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={targetUrl} title="Open in Browser" />
          <Action.CopyToClipboard content={targetUrl} title="Copy URL" />
          <Action.CopyToClipboard
            content={badgeMarkdown}
            title="Copy 'Featured on DevShelf' Badge Markdown"
            shortcut={{ modifiers: ["cmd", "shift"], key: "b" }}
          />
          <Action
            title="Roll Another Gem 🎲"
            icon={Icon.ArrowClockwise}
            onAction={() => {
              revalidate();
              showToast({ title: "Picked a new gem!", style: Toast.Style.Success });
            }}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
        </ActionPanel>
      }
    />
  );
}
