import type { MediaAsset, MediaManifest } from '../../models/chat';

let cachedManifest: MediaManifest | null = null;
let loading: Promise<MediaManifest> | null = null;

export async function loadMediaManifest(): Promise<MediaManifest> {
  if (cachedManifest) return cachedManifest;
  if (loading) return loading;

  loading = fetch('/knowledge-base/private/media-manifest.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((manifest: MediaManifest) => {
      cachedManifest = manifest;
      return manifest;
    })
    .catch((err) => {
      loading = null;
      throw err;
    });

  return loading;
}

export function lookupAsset(relativePath: string): MediaAsset | undefined {
  if (!cachedManifest) return undefined;

  const exact = cachedManifest.assets.find((a) => a.relativePath === relativePath);
  if (exact) return exact;

  // Fuzzy fallback by filename within same category
  const fileName = relativePath.split('/').pop()?.toLowerCase();
  if (!fileName) return undefined;
  const category = relativePath.split('/')[0];
  return cachedManifest.assets.find(
    (a) => a.relativePath.startsWith(category) && a.fileName.toLowerCase() === fileName
  );
}

/** Normalize a filename for fuzzy matching: lowercase, strip extension, replace separators */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, '') // strip extension
    .replace(/[_\-\s]+/g, ' ') // normalize separators to spaces
    .trim();
}

/** Match a citation filename (e.g. "Soul Wounds.pdf" or "pheydrus ai master catalog FINAL") to a media asset */
export function lookupAssetByFileName(fileName: string): MediaAsset | undefined {
  if (!cachedManifest) return undefined;

  // 1. Exact match
  const lower = fileName.toLowerCase();
  const exact = cachedManifest.assets.find((a) => a.fileName.toLowerCase() === lower);
  if (exact) return exact;

  // 2. Normalized match (strips extension, normalizes separators)
  const normalized = normalize(fileName);
  const normMatch = cachedManifest.assets.find((a) => normalize(a.fileName) === normalized);
  if (normMatch) return normMatch;

  // 3. Substring match — citation name contained in asset filename or vice versa
  return cachedManifest.assets.find((a) => {
    const normAsset = normalize(a.fileName);
    return normAsset.includes(normalized) || normalized.includes(normAsset);
  });
}
