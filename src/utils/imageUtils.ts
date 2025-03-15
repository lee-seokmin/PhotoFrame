import { PhotoMetadata } from '@/types/photo';

/**
 * 캔버스 생성 및 기본 설정
 */
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

/**
 * 이미지 메타데이터로부터 표시할 텍스트 생성
 */
function prepareDisplayData(metadata: PhotoMetadata): string[] {
  const displayData = [];
  
  if (metadata.Model) {
    displayData.push(metadata.Model);
  }
  
  if (metadata.FNumber) {
    displayData.push(`F${metadata.FNumber.toFixed(1)}`);
  }
  
  if (metadata.ExposureTime) {
    let exposureText;
    if (metadata.ExposureTime < 1) {
      exposureText = `1/${Math.round(1 / metadata.ExposureTime)}`;
    } else {
      exposureText = `${metadata.ExposureTime}s`;
    }
    displayData.push(exposureText);
  }
  
  if (metadata.ISO) {
    displayData.push(`ISO ${metadata.ISO}`);
  }
  
  return displayData;
}

/**
 * 메타데이터 텍스트를 캔버스에 렌더링
 */
function renderMetadataText(
  ctx: CanvasRenderingContext2D, 
  displayData: string[], 
  canvasWidth: number, 
  imgTop: number,
  imgHeight: number, 
  padding: number
): void {
  // 폰트 설정
  ctx.fillStyle = 'black';
  ctx.font = '35px Arial';
  
  // 전체 메타데이터 텍스트의 총 너비 계산
  const spacing = 40; // 각 항목 사이의 간격
  let totalWidth = 0;
  
  // 각 항목의 너비 계산 및 합산
  displayData.forEach((item, index) => {
    totalWidth += ctx.measureText(item).width;
    // 마지막 항목이 아니면 간격 추가
    if (index < displayData.length - 1) {
      totalWidth += spacing;
    }
  });
  
  // 시작 X 위치 계산 (중앙 정렬)
  let currentX = (canvasWidth - totalWidth) / 2;
  const textY = imgTop + imgHeight + padding * 2 + 20;
  
  // 각 항목을 개별적으로 렌더링
  displayData.forEach((item) => {
    ctx.fillText(item, currentX, textY);
    currentX += ctx.measureText(item).width + spacing;
  });
}

/**
 * 인스타그램 사용자명 렌더링
 */
function renderUsername(
  ctx: CanvasRenderingContext2D, 
  instagramUsername: string, 
  fileName: string, 
  canvasWidth: number, 
  textY: number
): void {
  const username = instagramUsername || fileName.split('.')[0] || 'user';
  const creditText = `Photo by @${username}`;

  ctx.font = '35px Arial';
  
  const creditWidth = ctx.measureText(creditText).width;
  const creditX = (canvasWidth - creditWidth) / 2;
  
  ctx.fillText(creditText, creditX, textY + 80);
}

/**
 * 이미지와 메타데이터가 있는 프레임 생성
 */
export async function createPhotoFrame(
  imageDataUrl: string,
  metadata: PhotoMetadata,
  fileName: string,
  instagramUsername: string = ''
): Promise<string> {
  try {
    // 이미지 로드
    const img = document.createElement('img');
    img.src = imageDataUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    const padding = 10;
    const metadataHeight = 150;
    
    // 캔버스 설정
    const { canvas, ctx, canvasWidth, scaledImgWidth, scaledImgHeight, imgX, imgY } = setupCanvas(
      imgWidth, 
      imgHeight, 
      padding, 
      metadataHeight
    );
    
    // 이미지 그리기
    ctx.drawImage(img, imgX, imgY, scaledImgWidth, scaledImgHeight);
    
    // 메타데이터 표시 데이터 준비
    const displayData = prepareDisplayData(metadata);
    
    // 메타데이터 텍스트 렌더링
    renderMetadataText(ctx, displayData, canvasWidth, imgY, scaledImgHeight, padding);
    
    // 인스타그램 사용자명 렌더링
    const textY = imgY + scaledImgHeight + padding * 2;
    renderUsername(ctx, instagramUsername, fileName, canvasWidth, textY);

    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (err) {
    console.error('Error creating photo frame:', err);
    throw new Error('Failed to create photo frame');
  }
}

export function downloadImage(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `framed_${fileName || 'photo'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 