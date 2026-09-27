/** Resolve an explicitly configured or detected GitHub repository; never guess a personal repo. */
export function resolveCmsRepository({ configured, workflow, remote = '' } = {}) {
  const detected = remote.trim().match(/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+\/[^/]+?)\/?$/)?.[1]?.replace(/\.git$/, '');
  const repo = configured?.trim() || workflow?.trim() || detected;
  if (!repo || !/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(repo)
    || ['.', '..'].includes(repo.split('/')[1])) {
    throw new Error('Cannot determine the CMS GitHub repository. Set CMS_REPOSITORY=owner/repo or configure a GitHub origin remote.');
  }
  return repo;
}
