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
  // 캔버스 비율을 4:5 (가로:세로)로 고정
  let canvasWidth = imgWidth + (padding * 2);
  let canvasHeight = imgHeight + metadataHeight + (padding * 3);
  
  // 4:5 비율 적용
  const targetAspectRatio = 4 / 5; // 0.8 (가로:세로 = 4:5)
  const currentAspectRatio = canvasWidth / canvasHeight;
  
  // 비율 조정
  if (currentAspectRatio > targetAspectRatio) {
    // 너무 가로로 긴 경우 - 높이 늘리기
    canvasHeight = Math.ceil(canvasWidth / targetAspectRatio);
  } else if (currentAspectRatio < targetAspectRatio) {
    // 너무 세로로 긴 경우 - 너비 늘리기
    canvasWidth = Math.ceil(canvasHeight * targetAspectRatio);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 이미지 중앙 배치
  const scaledImgWidth = imgWidth;
  const scaledImgHeight = imgHeight;

  const imgX = Math.max(padding, (canvasWidth - scaledImgWidth) / 2);
  const imgY = padding;
  
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
function prepareDisplayData(metadata: PhotoMetadata): {
  leftData: string[];
  leftDateData: string[];
  rightData: string[];
} {
  const leftData = [];
  const leftDateData = [];
  const rightData = [];
  
  // 왼쪽 데이터: ISO, FNumber, ExposureTime, FocalLength
  if (metadata.ISO) {
    leftData.push(`ISO ${metadata.ISO}`);
  }
  
  if (metadata.FNumber) {
    leftData.push(`F${metadata.FNumber.toFixed(1)}`);
  }
  
  if (metadata.ExposureTime) {
    let exposureText;
    if (metadata.ExposureTime < 1) {
      exposureText = `1/${Math.round(1 / metadata.ExposureTime)}`;
    } else {
      exposureText = `${metadata.ExposureTime}s`;
    }
    leftData.push(exposureText);
  }
  
  if (metadata.FocalLength) {
    leftData.push(`${metadata.FocalLength}mm`);
  }
  
  // 왼쪽 날짜 데이터
  if (metadata.DateTimeOriginal) {
    // DateTimeOriginal을 보기 좋게 포맷팅 (YYYY:MM:DD HH:MM:SS -> YYYY.MM.DD)
    const dateStr = metadata.DateTimeOriginal;
    if (dateStr.length >= 10) {
      const formattedDate = dateStr.substring(0, 10).replace(/:/g, '.');
      leftDateData.push(formattedDate);
    } else {
      leftDateData.push(dateStr);
    }
  }
  
  // 오른쪽 데이터: Model, LensModel
  if (metadata.Model) {
    rightData.push(metadata.Model);
  }
  
  if (metadata.LensModel) {
    rightData.push(metadata.LensModel);
  }
  
  return { leftData, leftDateData, rightData };
}

/**
 * 메타데이터 텍스트를 캔버스에 렌더링
 */
function renderMetadata(
  ctx: CanvasRenderingContext2D,
  leftData: string[],
  leftDateData: string[],
  rightData: string[],
  username: string,
  canvasWidth: number,
  imgTop: number,
  imgHeight: number,
  padding: number,
  imgX: number,
  scaledImgWidth: number
): void {
  // 폰트 설정
  ctx.fillStyle = 'black';
  ctx.font = '60px "Montserrat", "Open Sans", sans-serif';
  
  const spacing = 40; // 각 항목 사이의 간격
  const textY = imgTop + imgHeight + padding + 30; // 이미지 끝에서 패딩만큼 떨어진 위치
  const lineHeight = 80; // 줄 간격
  
  // 이미지의 가로 시작점과 끝점 계산
  const imgStartX = imgX;
  const imgWidth = scaledImgWidth;
  const imgEndX = imgStartX + imgWidth;
  
  // 왼쪽 데이터 렌더링 (이미지 왼쪽 경계에 맞춤)
  let currentX = imgStartX;
  leftData.forEach((item) => {
    ctx.fillText(item, currentX, textY);
    currentX += ctx.measureText(item).width + spacing;
  });
  
  // 왼쪽 날짜 데이터 렌더링 (왼쪽 데이터 아래)
  if (leftDateData.length > 0) {
    leftDateData.forEach((item) => {
      ctx.fillText(item, imgStartX, textY + lineHeight);
    });
  }
  
  // 중앙 사용자명 렌더링 (이미지 중앙 정렬)
  if (username) {
    const creditText = `Photo by @${username}`;
    const creditWidth = ctx.measureText(creditText).width;
    const creditX = imgStartX + (imgWidth - creditWidth) / 2;
    ctx.fillText(creditText, creditX, textY);
  }
  
  // 오른쪽 데이터 렌더링 (이미지 오른쪽 경계에 맞춤, 세로로 배치)
  if (rightData.length > 0) {
    // 이미지 오른쪽 경계 위치 계산
    const rightEdge = imgEndX;
    
    // 각 항목을 세로로 렌더링 (오른쪽 정렬)
    if (rightData.length === 1) {
      // 하나만 있으면 중앙에 배치
      const itemWidth = ctx.measureText(rightData[0]).width;
      ctx.fillText(rightData[0], rightEdge - itemWidth, textY);
    } else {
      rightData.forEach((item, index) => {
        const itemWidth = ctx.measureText(item).width;
        const itemY = textY + (index * lineHeight);
        ctx.fillText(item, rightEdge - itemWidth, itemY);
      });
    }
  }
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
    
    const padding = 50;
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
    const { leftData, leftDateData, rightData } = prepareDisplayData(metadata);
    
    // 사용자명 준비
    const username = instagramUsername || fileName.split('.')[0] || 'user';
    
    // 메타데이터 및 사용자명 렌더링
    renderMetadata(ctx, leftData, leftDateData, rightData, username, canvasWidth, imgY, scaledImgHeight, padding, imgX, scaledImgWidth);

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