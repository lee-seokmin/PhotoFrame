import { generateRSS } from '@/utils/rssUtils';

/**
 * RSS 피드를 위한 Route Handler
 * /rss.xml 경로로 접근하면 RSS 피드를 XML 형식으로 제공합니다.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // 사이트 정보
  const siteInfo = {
    title: 'PhotoFrame',
    description: '당신의 소중한 순간을 간직하세요 - 디지털 포토 프레임 서비스',
    siteUrl: baseUrl,
    language: 'ko-KR',
  };
  
  // RSS 피드 아이템 (실제 환경에서는 데이터베이스나 파일 시스템에서 동적으로 가져올 수 있습니다)
  const feedItems = [
    {
      title: '포토프레임 서비스 출시',
      description: '당신의 소중한 순간을 간직할 수 있는 포토프레임 서비스가 출시되었습니다.',
      url: `${baseUrl}`,
      date: new Date(),
      author: 'PhotoFrame Team',
      categories: ['출시', '서비스'],
    },
    {
      title: '나만의 프레임 만들기',
      description: '나만의 특별한 포토프레임을 만들고 공유해보세요.',
      url: `${baseUrl}/create-frame`,
      date: new Date(Date.now() - 86400000), // 하루 전
      author: 'PhotoFrame Team',
      categories: ['튜토리얼', '가이드'],
    },
    // 필요한 만큼 아이템을 추가할 수 있습니다
  ];
  
  // RSS 피드 생성
  const rss = generateRSS(siteInfo, feedItems);
  
  // XML 응답 반환
  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
} 