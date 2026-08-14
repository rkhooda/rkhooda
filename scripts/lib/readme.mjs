import { readFileSync, writeFileSync } from 'node:fs';

export const README = new URL('../../README.md', import.meta.url).pathname;

export const readReadme = () => readFileSync(README, 'utf8');
export const writeReadme = (md) => writeFileSync(README, md);

/** Replace the content between `<!-- name:start -->` and `<!-- name:end -->`. */
export function updateSection(md, name, content) {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(md)) throw new Error(`README is missing the "${name}" markers`);
  return md.replace(re, `$1\n${content}\n$2`);
}

/**
 * GitHub proxies README images through camo and caches them hard, so a regenerated
 * SVG at the same URL can stay stale for hours. Bumping a query param changes the
 * camo key and forces a refetch.
 */
export function bustCache(md, files, version = Date.now().toString(36)) {
  return files.reduce((out, file) => {
    const pattern = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return out.replace(new RegExp(`${pattern}\\?v=[\\w.-]+`, 'g'), `${file}?v=${version}`);
  }, md);
}
