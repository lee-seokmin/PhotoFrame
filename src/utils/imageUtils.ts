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
  const canvasWidth = imgWidth + (padding * 2);
  const canvasHeight = imgHeight + metadataHeight + (padding * 2);
  
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
 * 뒷배경이될 블러 이미지 생성 (모바일 호환성 개선)
 */
function createBlurImage(img: HTMLImageElement): {
  blurImageCanvas: HTMLCanvasElement;
  blurImageCtx: CanvasRenderingContext2D;
} {
  const targetWidth = Math.min(2160, window.innerWidth * 2);
  const targetHeight = Math.min(2700, window.innerHeight * 2);
  
  // Create a canvas for the downsized image (downsampling helps with blur effect)
  const smallCanvas = document.createElement('canvas');
  const downscaleFactor = 0.25; // Reduce to 25% for better performance
  smallCanvas.width = targetWidth * downscaleFactor;
  smallCanvas.height = targetHeight * downscaleFactor;
  
  const smallCtx = smallCanvas.getContext('2d');
  if (!smallCtx) throw new Error('Could not get canvas context');
  
  // Draw the original image to the small canvas
  smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
  
  // Create the final canvas for the blurred result
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) throw new Error('Could not get canvas context');
  
  // Draw the downsampled image back to the full-size canvas (this creates a blur-like effect)
  finalCtx.drawImage(smallCanvas, 0, 0, targetWidth, targetHeight);
  
  // Apply multiple passes of box blur for smoother results (works on all devices)
  const iterations = 3;
  for (let i = 0; i < iterations; i++) {
    applyBoxBlur(finalCanvas, finalCtx, 8);
  }
  
  return {
    blurImageCanvas: finalCanvas,
    blurImageCtx: finalCtx
  };
}

/**
 * 박스 블러 알고리즘 구현 (CSS filter 대신 사용)
 */
function applyBoxBlur(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, radius: number): void {
  const width = canvas.width;
  const height = canvas.height;
  
  // Get image data
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;
  const tempImgData = ctx.createImageData(width, height);
  const tempPixels = tempImgData.data;
  
  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      // Sum the surrounding pixels
      for (let i = Math.max(0, x - radius); i < Math.min(width, x + radius + 1); i++) {
        const idx = (y * width + i) * 4;
        r += pixels[idx];
        g += pixels[idx + 1];
        b += pixels[idx + 2];
        a += pixels[idx + 3];
        count++;
      }
      
      // Average and set
      const outIdx = (y * width + x) * 4;
      tempPixels[outIdx] = r / count;
      tempPixels[outIdx + 1] = g / count;
      tempPixels[outIdx + 2] = b / count;
      tempPixels[outIdx + 3] = a / count;
    }
  }
  
  // Copy temp data for vertical pass
  for (let i = 0; i < pixels.length; i++) {
    pixels[i] = tempPixels[i];
  }
  
  // Vertical pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      // Sum the surrounding pixels
      for (let j = Math.max(0, y - radius); j < Math.min(height, y + radius + 1); j++) {
        const idx = (j * width + x) * 4;
        r += pixels[idx];
        g += pixels[idx + 1];
        b += pixels[idx + 2];
        a += pixels[idx + 3];
        count++;
      }
      
      // Average and set
      const outIdx = (y * width + x) * 4;
      tempPixels[outIdx] = r / count;
      tempPixels[outIdx + 1] = g / count;
      tempPixels[outIdx + 2] = b / count;
      tempPixels[outIdx + 3] = a / count;
    }
  }
  
  // Put the blurred data back
  ctx.putImageData(tempImgData, 0, 0);
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
    
    // 블러 이미지 생성 - 모바일에서도 작동하는 개선된 방식
    const { blurImageCanvas } = createBlurImage(img);

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


    const final_canvas = document.createElement('canvas');
    final_canvas.width = 2160;
    final_canvas.height = 2700;

    const final_ctx = final_canvas.getContext('2d');
    if (!final_ctx) throw new Error('Could not get canvas context');

    // Draw the blurred background first
    final_ctx.drawImage(blurImageCanvas, 0, 0, 2160, 2700);

    // Calculate the aspect ratio of the original canvas
    const canvasAspectRatio = canvas.width / canvas.height;
    
    // Calculate dimensions that fit within the final canvas
    // Use 80% of available space as maximum size
    const maxWidth = Math.round(2160 * 0.95);
    const maxHeight = Math.round(2700 * 0.95);
    
    // Determine which dimension is more constraining
    let newWidth, newHeight;
    if (canvasAspectRatio > maxWidth / maxHeight) {
      // Width is the constraining factor
      newWidth = maxWidth;
      newHeight = Math.round(newWidth / canvasAspectRatio);
    } else {
      // Height is the constraining factor
      newHeight = maxHeight;
      newWidth = Math.round(newHeight * canvasAspectRatio);
    }
    
    // Calculate position to center the canvas
    const centerX = Math.round((2160 - newWidth) / 2);
    const centerY = Math.round((2700 - newHeight) / 2);
    
    // Draw the original canvas centered and scaled
    final_ctx.drawImage(canvas, centerX, centerY, newWidth, newHeight);

    return final_canvas.toDataURL('image/jpeg', 0.95);
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