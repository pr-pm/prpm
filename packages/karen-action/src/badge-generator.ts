import { getKarenEmoji } from './karen-config';

export function generateKarenBadge(score: number, grade: string): string {
  const emoji = getKarenEmoji(score);

  // Color based on score
  let color: string;
  if (score >= 90) color = '#10b981'; // green
  else if (score >= 70) color = '#3b82f6'; // blue
  else if (score >= 50) color = '#f59e0b'; // yellow
  else if (score >= 30) color = '#f97316'; // orange
  else color = '#ef4444'; // red

  const width = 200;
  const height = 20;
  const labelWidth = 80;
  const scoreWidth = width - labelWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="Karen Score: ${score}">
  <title>Karen Score: ${score}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${width}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="#555"/>
    <rect x="${labelWidth}" width="${scoreWidth}" height="${height}" fill="${color}"/>
    <rect width="${width}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">Karen Score</text>
    <text x="${labelWidth / 2}" y="14" fill="#fff">Karen Score</text>
    <text aria-hidden="true" x="${labelWidth + scoreWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${emoji} ${score}</text>
    <text x="${labelWidth + scoreWidth / 2}" y="14" fill="#fff">${emoji} ${score}</text>
  </g>
</svg>`;
}
