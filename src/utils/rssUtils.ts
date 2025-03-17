/**
 * RSS 피드 생성 유틸리티
 * 웹사이트의 콘텐츠를 XML 형식의 RSS 피드로 변환하는 함수들을 포함합니다.
 */

/**
 * RSS 피드를 생성하는 함수
 * @param siteInfo 사이트 정보
 * @param items RSS 피드에 포함될 아이템들
 * @returns RSS 피드 XML 문자열
 */
export function generateRSS(
  siteInfo: {
    title: string;
    description: string;
    siteUrl: string;
    language?: string;
  },
  items: {
    title: string;
    description: string;
    url: string;
    date: Date;
    author?: string;
    categories?: string[];
  }[]
): string {
  const { title, description, siteUrl, language = 'ko-KR' } = siteInfo;
  
  // RSS 2.0 스펙에 맞는 XML 생성
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <link>${siteUrl}</link>
    <language>${language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items
      .map((item) => {
        return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description)}</description>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      ${item.author ? `<author>${escapeXml(item.author)}</author>` : ''}
      ${
        item.categories
          ? item.categories.map((category) => `<category>${escapeXml(category)}</category>`).join('')
          : ''
      }
    </item>`;
      })
      .join('')}
  </channel>
</rss>`;

  return rss;
}

/**
 * XML 특수 문자를 이스케이프하는 함수
 * @param str 이스케이프할 문자열
 * @returns 이스케이프된 문자열
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
} 