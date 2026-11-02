// Decides whether the live site is running a different build from this page.
// Returns false for anything unexpected so a bad response never nags the user.
export function hasNewBuild(currentBuild, payload) {
  if (!currentBuild || !payload || typeof payload !== 'object') return false;
  const remote = typeof payload.build === 'string' ? payload.build.trim() : '';
  return remote !== '' && remote !== currentBuild;
}
