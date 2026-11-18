# Charm VHS script — generates a crisp 15-second terminal GIF for DevShelf
# Install VHS: https://github.com/charmbracelet/vhs
# Run: vhs assets/demo.tape

Output assets/demo.gif

Set Shell "powershell"
Set FontSize 16
Set Width 1100
Set Height 640
Set Padding 24
Set Theme "TokyoNight"
Set TypingSpeed 35ms

Hide
Type "function prompt { '$ ' }"
Enter
Type "function devshelf { node bin/cli.js @args }"
Enter
Type "Clear-Host"
Enter
Sleep 600ms
Show

Type "# 1. Search 576 CI-audited zero-paywall tools & free APIs"
Enter
Sleep 400ms
Type "devshelf search postgres"
Enter
Sleep 3.5s

Type "Clear-Host"
Enter
Sleep 300ms

Type "# 2. Discover open-source MCP & AI developer tools"
Enter
Sleep 400ms
Type "devshelf search mcp"
Enter
Sleep 3.5s
