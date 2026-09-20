module.exports = async function postSubmissionComment({ github, context }) {
  const username = context.payload.issue.user.login;

  const commentBody = [
    `?? **Congratulations @${username}!**`,
    "",
    "Your submission has been verified and is now live on [DevShelf](https://github.com/RitualDev-Lab/DevShelf) and the [Interactive Web App](https://ritualdev-lab.github.io/DevShelf)!",
    "",
    "---",
    "",
    '### ??? Display the "Featured on DevShelf" Badge on Your README',
    "",
    "If you'd like to show it off on your README, pick whichever style fits your project:",
    "",
    "#### Option 1: Modern Electric Violet (Recommended)",
    "[![Featured on DevShelf](https://img.shields.io/badge/Featured_on-DevShelf-8B5CF6?style=for-the-badge&logo=compass&logoColor=06B6D4&labelColor=0B0F19)](https://ritualdev-lab.github.io/DevShelf/)",
    "",
    "```markdown",
    "[![Featured on DevShelf](https://img.shields.io/badge/Featured_on-DevShelf-8B5CF6?style=for-the-badge&logo=compass&logoColor=06B6D4&labelColor=0B0F19)](https://ritualdev-lab.github.io/DevShelf/)",
    "```",
    "",
    "#### Option 2: Terminal Emerald",
    "[![DevShelf Verified](https://img.shields.io/badge/DevShelf-100%25_Verified_FOSS-10B981?style=for-the-badge&logo=gnubash&logoColor=white&labelColor=111827)](https://ritualdev-lab.github.io/DevShelf/)",
    "",
    "```markdown",
    "[![DevShelf Verified](https://img.shields.io/badge/DevShelf-100%25_Verified_FOSS-10B981?style=for-the-badge&logo=gnubash&logoColor=white&labelColor=111827)](https://ritualdev-lab.github.io/DevShelf/)",
    "```",
    "",
    "#### Option 3: Minimal Dark Pill",
    "[![Featured on DevShelf](https://img.shields.io/badge/??_Featured_on-DevShelf-6366F1?style=flat&labelColor=1E1E2E&color=A855F7)](https://ritualdev-lab.github.io/DevShelf/)",
    "",
    "```markdown",
    "[![Featured on DevShelf](https://img.shields.io/badge/??_Featured_on-DevShelf-6366F1?style=flat&labelColor=1E1E2E&color=A855F7)](https://ritualdev-lab.github.io/DevShelf/)",
    "```",
    "",
    "Thank you for contributing to the open-source community! ?",
  ].join("\n");

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: commentBody,
  });

  await github.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    state: "closed",
  });
};
