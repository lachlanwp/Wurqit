// githubDownloads.js
const GITHUB_OWNER = "lachlanwp";
const GITHUB_REPO = "wurqit";

/**
 * Fetch all releases and sum download counts.
 * @returns {Promise<number>}
 */
export async function getTotalDownloadCount() {
  const endpoint = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases?per_page=100`;

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/vnd.github+json",
      // Optionally add Authorization: `Bearer <token>` if you have a token
    },
  });

  if (!response.ok) {
    console.error("GitHub API error:", response.status, response.statusText);
    return 0;
  }

  const releases = await response.json();

  let total = 0;
  for (const release of releases) {
    if (Array.isArray(release.assets)) {
      for (const asset of release.assets) {
        total += asset.download_count || 0;
      }
    }
  }

  return total;
}
