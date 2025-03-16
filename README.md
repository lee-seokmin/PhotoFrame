이 웹사이트는 [Next.js](https://nextjs.org/)를 사용해 만들어졌습니다.

<br>

[![Netlify Status](https://api.netlify.com/api/v1/badges/7913246e-2b44-4772-9f57-2f4119fa43a4/deploy-status)](https://app.netlify.com/sites/photoframeo/deploys)

## 이 사이트를 만든 목적

인스타그램에 자신이 찍은 사진을 올릴 때, 원본 그대로 올리는 것 보다 그 사진의 [EXIF](https://namu.wiki/w/EXIF)(셔터 스피드, 조리개 값, ISO등)를 입력해 놓음으로써 사람들이 정보를 알 수 있게 되는 프레임을 만드는 것이 유행이다.  
그러나, 이 작업은 포토샵으로 일일이 입력해야 하다는 것이 단점이었다. 그래서 이 작업을 Python 코드로 자동화하여 사용자에게 제공하면 더욱 편리하겠다는 생각을 하여 만들었다.


## Getting Started

먼저, 로컬 서버에서 다음의 커맨드를 실행한다:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

로컬 주소 [http://localhost:3000](http://localhost:3000)에 접속하여 결과물을 확인한다.

## 주요 코드

```typescript
function setupCanvas(imgWidth: number, imgHeight: number, padding: number, metadataHeight: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  scaledImgWidth: number;
  scaledImgHeight: number;
  imgX: number;
  imgY: number;
} {
  // 고정 캔버스 크기
  const canvasWidth = 1080 * 2;
  const canvasHeight = 1350 * 2;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // 배경 설정
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 이미지 크기 계산 (캔버스에 맞게 스케일링)
  const imageArea = canvasHeight - (padding * 5) - metadataHeight;
  const scale = Math.min(
    (canvasWidth - padding * 2) / imgWidth,
    imageArea / imgHeight
  );
  
  const scaledImgWidth = imgWidth * scale;
  const scaledImgHeight = imgHeight * scale;
  
  // 이미지 위치 계산 (가로 및 세로 중앙 정렬)
  const imgX = (canvasWidth - scaledImgWidth) / 2;
  
  // 가로 이미지(landscape)인 경우 수직 중앙 정렬
  let imgY = padding * 2;
  if (imgWidth > imgHeight) {
    // 가로 이미지면 수직으로도 중앙에 배치
    imgY = (canvasHeight - metadataHeight - scaledImgHeight) / 2;
  }
  
  return {
    canvas,
    ctx,
    canvasWidth,
    canvasHeight,
    scaledImgWidth,
    scaledImgHeight,
    imgX,
    imgY
  };
}
```

## 로직

```mermaid
flowchart LR
    A(프론트엔드)
    B[사진의 메타 데이터 가져오기]
    C[canvas를 이용하여
    흰 배경 만들기]
    D[원본 사진을 일정한 
    비율에 맞춰 resize하기]
    E[흰 배경에 resize된 사진과
    메타 데이터 입력하기]

    A ---> |사진 전송| B
    subgraph 백엔드
    B --- C --- D --- E
    end
    E ---> |생성된 이미지를 base64로 
    인코딩하여 return하기| A
```
