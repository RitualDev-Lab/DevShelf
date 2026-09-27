module.exports = async function postSubmissionComment({ github, context, prUrl, prNumber }) {
  const username = context.payload.issue.user.login;

  const commentBody = [
    `🎉 **Thank you @${username} for submitting to DevShelf!**`,
    "",
    prUrl
      ? `We have automatically generated a Pull Request for your submission:\n👉 **[Pull Request #${prNumber}](${prUrl})**`
      : "Your submission has been verified and processed.",
    "",
    "### 🛡️ What happens next?",
    "- Our automated CI suite will audit the URL endpoint, schema conformance, and security posture.",
    "- You have been credited as **Co-Author** on the submission commit.",
    "- Once merged, your project will be permanently indexed at [devshelf.ritualdev.in](https://devshelf.ritualdev.in) and featured in our community spotlight!",
    "",
    "---",
    "",
    '### 🎖️ Display the "Featured on DevShelf" Badge',
    "Once merged, you can display an official community verification badge on your repository:",
    "",
    "```markdown",
    "[![Featured on DevShelf](https://img.shields.io/badge/Featured%20on-DevShelf-7928CA?style=for-the-badge&logo=googlechrome&logoColor=white)](https://devshelf.ritualdev.in/)",
    "```",
    "",
    "Thank you for powering the zero-paywall open-source movement! 🚀",
  ].join("\n");

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: commentBody,
  });
};
