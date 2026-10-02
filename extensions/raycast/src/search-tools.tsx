import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";

interface DevShelfItem {
  name: string;
  url?: string;
  repo?: string;
  category?: string;
  description: string;
  freeTier?: string;
  language?: string;
  license?: string;
  statusTags?: string[];
  type?: string;
}

interface ApiResponse {
  totalCount: number;
  tools: DevShelfItem[];
}

export default function SearchTools() {
  const [searchText, setSearchText] = useState("");
  const { isLoading, data } = useFetch<ApiResponse>("https://devshelf.ritualdev.in/api/v1/tools.json");

  const tools = data?.tools || [];
  const filtered = tools.filter((tool) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      (tool.category && tool.category.toLowerCase().includes(q)) ||
      (tool.language && tool.language.toLowerCase().includes(q))
    );
  });

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search 500+ free developer tools, APIs, AI frameworks..."
      throttle
    >
      <List.Section title={`DevShelf Tools (${filtered.length} results)`}>
        {filtered.slice(0, 50).map((tool) => {
          const targetUrl = tool.repo || tool.url || "https://devshelf.ritualdev.in";
          const badgeMarkdown = `[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)`;

          return (
            <List.Item
              key={tool.name}
              title={tool.name}
              subtitle={tool.description}
              accessories={[
                ...(tool.category ? [{ tag: tool.category }] : []),
                ...(tool.language ? [{ text: tool.language, icon: Icon.Code }] : []),
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser url={targetUrl} title="Open in Browser" />
                  <Action.CopyToClipboard content={targetUrl} title="Copy URL" />
                  <Action.CopyToClipboard
                    content={badgeMarkdown}
                    title="Copy 'Featured on DevShelf' Badge Markdown"
                    shortcut={{ modifiers: ["cmd", "shift"], key: "b" }}
                  />
                  <Action.OpenInBrowser
                    url={`https://devshelf.ritualdev.in/?q=${encodeURIComponent(tool.name)}`}
                    title="View on DevShelf Web"
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}
