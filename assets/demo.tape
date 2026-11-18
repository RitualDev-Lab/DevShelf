# Charm VHS script — generates a crisp 15-second terminal GIF for DevShelf
# Install VHS: https://github.com/charmbracelet/vhs
# Run: vhs assets/demo.tape

Output assets/demo.gif

Set Shell "bash"
Set FontSize 16
Set Width 1100
Set Height 620
Set Padding 20
Set Theme "TokyoNight"
Set TypingSpeed 40ms

Type "# 1. Search 576 CI-audited zero-paywall tools & free APIs"
Enter
Sleep 600ms
Type `npx @ritualdev-lab/devshelf search "postgres"`
Enter
Sleep 3s

Type "# 2. Search open-source AI & MCP developer tools"
Enter
Sleep 600ms
Type `npx @ritualdev-lab/devshelf search "mcp"`
Enter
Sleep 3s

Type "# 3. Connect DevShelf to Claude Desktop / Cursor via MCP"
Enter
Sleep 600ms
Type "npx @ritualdev-lab/devshelf --help"
Enter
Sleep 2s
