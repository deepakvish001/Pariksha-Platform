export interface DetectedFeatures {
  headings: number;
  codeBlocks: number;
  tables: number;
  images: number;
  math: number;
  callouts: number;
  links: number;
  totalLines: number;
}

export function detectMarkdownFeatures(md: string): DetectedFeatures {
  if (!md) {
    return {
      headings: 0,
      codeBlocks: 0,
      tables: 0,
      images: 0,
      math: 0,
      callouts: 0,
      links: 0,
      totalLines: 0,
    };
  }
  const lines = md.split("\n");
  let inFence = false;
  let codeBlocks = 0;
  let headings = 0;
  let tables = 0;
  let callouts = 0;
  for (const ln of lines) {
    if (/^```/.test(ln)) {
      if (!inFence) codeBlocks += 1;
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^#{1,6}\s/.test(ln)) headings += 1;
    if (/^\s*\|.*\|\s*$/.test(ln) && /---/.test(ln)) tables += 1;
    if (/^\s*>\s*\[!(note|info|tip|success|warning|danger|important|caution|question|quote)\]/i.test(ln))
      callouts += 1;
  }
  const images = (md.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
  const links = (md.match(/(?<!!)\[[^\]]+\]\([^)]+\)/g) || []).length;
  const math = (md.match(/\$\$[\s\S]+?\$\$|\$[^\n$]+?\$/g) || []).length;
  return {
    headings,
    codeBlocks,
    tables,
    images,
    math,
    callouts,
    links,
    totalLines: lines.length,
  };
}
