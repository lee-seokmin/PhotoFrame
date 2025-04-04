import { NextRequest, NextResponse } from 'next/server';
import exifr from 'exifr';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    // 클라이언트에서 추출한 메타데이터 가져오기
    const clientMetadataString = formData.get('clientMetadata') as string | null;
    let clientMetadata = null;
    
    // 클라이언트에서 전송된 유저 에이전트 확인 (모바일 여부 감지)
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    console.log('API 요청 - 모바일 디바이스 여부:', isMobile);
    
    if (clientMetadataString) {
      try {
        clientMetadata = JSON.parse(clientMetadataString);
        console.log('클라이언트 메타데이터 수신 성공');
      } catch (parseError) {
        console.error('클라이언트 메타데이터 파싱 오류:', parseError);
      }
    }
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // 파일 크기 제한 확인 (서버에서도 이중으로 체크)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다.' },
        { status: 413 }
      );
    }

    // Convert the file to an ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Vercel API 크기 제한 (4.5MB)
    const VERCEL_SIZE_LIMIT = 4.5 * 1024 * 1024;
    
    // 메타데이터 추출 시도
    let metadata = null;
    try {
      // 모바일 디바이스에서는 클라이언트 메타데이터를 우선적으로 사용 (압축 과정에서 손실되는 경우가 많음)
      if (isMobile && clientMetadata) {
        console.log('모바일 디바이스: 클라이언트 메타데이터 우선 사용');
        try {
          metadata = extractClientMetadata(clientMetadata);
        } catch (clientMetaError) {
          console.error('모바일 클라이언트 메타데이터 파싱 실패:', clientMetaError);
        }
      }
      
      // 모바일이 아니거나 클라이언트 메타데이터 추출 실패 시 서버에서 추출 시도
      if (!metadata) {
        try {
          // exifr로 메타데이터 추출 시도
          metadata = await exifr.parse(Buffer.from(buffer));
          console.log('서버에서 메타데이터 추출 성공');
        } catch (exifrError) {
          console.error('exifr로 메타데이터 추출 실패:', exifrError);
        }
        
        // 서버 메타데이터 추출에 실패했고, 클라이언트 메타데이터가 있으면 사용
        if (!metadata && clientMetadata) {
          console.log('서버 메타데이터 추출 실패, 클라이언트 메타데이터 사용');
          try {
            metadata = extractClientMetadata(clientMetadata);
          } catch (clientMetaError) {
            console.error('클라이언트 메타데이터 변환 실패:', clientMetaError);
          }
        }
      }
    } catch (metadataError) {
      console.error('메타데이터 처리 중 오류:', metadataError);
    }
    
    // 최종 메타데이터 필터링 및 정리
    const filteredMetadata = {
      Make: metadata?.Make || null,
      Model: metadata?.Model || null,
      ExposureTime: metadata?.ExposureTime || null,
      ISO: metadata?.ISO || null,
      FNumber: metadata?.FNumber || null,
      FocalLength: metadata?.FocalLength || null,
      DateTimeOriginal: metadata?.DateTimeOriginal || null,
      LensModel: metadata?.LensModel || null
    };
    
    // 메타데이터 유무 확인 로그
    const hasMetadata = Object.values(filteredMetadata).some(value => value !== null);
    console.log('메타데이터 추출 결과:', hasMetadata ? '성공' : '실패');
    
    try {
      let imageBuffer;
      let dataUrl;
      
      // 이미 클라이언트에서 압축되어 충분히 작으면 압축 과정 건너뛰기
      if (buffer.byteLength <= VERCEL_SIZE_LIMIT) {
        console.log('이미지가 이미 충분히 작음, 서버 압축 과정 건너뛰기:', (buffer.byteLength / (1024 * 1024)).toFixed(2) + 'MB');
        imageBuffer = Buffer.from(buffer);
      } else {
        // 필요한 경우만 추가 압축 수행
        console.log('이미지 크기가 여전히 너무 큼, 서버에서 추가 압축 시작:', (buffer.byteLength / (1024 * 1024)).toFixed(2) + 'MB');
        try {
          // 메타데이터를 유지하면서 압축
          imageBuffer = await compressImage(Buffer.from(buffer), file.type, isMobile);
          
          // 압축이 효과적이지 않으면 원본 사용
          if (imageBuffer.length > buffer.byteLength * 0.9) {
            console.log('압축이 효과적이지 않음, 원본 사용');
            imageBuffer = Buffer.from(buffer);
          }
        } catch (compressError) {
          console.error('이미지 압축 오류:', compressError);
          console.warn('압축 실패, 원본 이미지 사용');
          imageBuffer = Buffer.from(buffer);
        }
      }
      
      // 이미지 데이터를 Base64로 변환
      try {
        const base64Image = imageBuffer.toString('base64');
        dataUrl = `data:${file.type};base64,${base64Image}`;
      } catch (encodingError) {
        console.error('Base64 인코딩 오류:', encodingError);
        return NextResponse.json(
          { error: '이미지 인코딩 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.' },
          { status: 500 }
        );
      }
      
      // 최종 결과 반환
      return NextResponse.json({
        filteredMetadata,
        imageData: {
          dataUrl,
          type: file.type,
          name: file.name.split('.')[0]
        }
      });
      
    } catch (imageProcessingError) {
      console.error('이미지 처리 중 오류:', imageProcessingError);
      return NextResponse.json(
        { error: '이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: '파일 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 클라이언트에서 전송된 메타데이터 추출 함수
 * @param clientMetadata 클라이언트에서 전송된 메타데이터
 * @returns 추출된 메타데이터 객체
 */
function extractClientMetadata(clientMetadata: Record<string, unknown>) {
  // ExifReader와 다른 메타데이터 라이브러리에 따라 구조가 달라질 수 있어 두 경우 모두 처리
  
  // 표준 키를 찾아서 값 추출
  const extractValueFromClientMeta = (key: string) => {
    // ExifReader 형식
    if (clientMetadata[key] && typeof clientMetadata[key] === 'object' && clientMetadata[key] !== null) {
      const metaObj = clientMetadata[key] as Record<string, unknown>;
      if ('description' in metaObj) {
        return metaObj.description;
      }
    }
    
    // 다른 형식 (일반 객체 값)
    if (clientMetadata[key] && typeof clientMetadata[key] !== 'object') {
      return clientMetadata[key];
    }
    
    // 특정 태그가 다른 명칭으로 저장되어 있을 수 있음
    const aliases: Record<string, string[]> = {
      'ISO': ['ISOSpeedRatings', 'PhotographicSensitivity', 'ISO'],
      'ExposureTime': ['ExposureTime', 'ShutterSpeedValue'],
      'DateTimeOriginal': ['DateTimeOriginal', 'DateTime', 'CreateDate']
    };
    
    if (aliases[key]) {
      for (const alias of aliases[key]) {
        if (clientMetadata[alias] && typeof clientMetadata[alias] === 'object' && clientMetadata[alias] !== null) {
          const aliasObj = clientMetadata[alias] as Record<string, unknown>;
          if ('description' in aliasObj) {
            return aliasObj.description;
          }
        }
        if (clientMetadata[alias] && typeof clientMetadata[alias] !== 'object') {
          return clientMetadata[alias];
        }
      }
    }
    
    return null;
  };
  
  // 메타데이터 객체 생성
  return {
    Make: extractValueFromClientMeta('Make'),
    Model: extractValueFromClientMeta('Model'),
    ExposureTime: parseFloatSafe(extractValueFromClientMeta('ExposureTime')),
    ISO: parseIntSafe(extractValueFromClientMeta('ISO')),
    FNumber: parseFloatSafe(extractValueFromClientMeta('FNumber')),
    FocalLength: parseFloatSafe(extractValueFromClientMeta('FocalLength')),
    DateTimeOriginal: extractValueFromClientMeta('DateTimeOriginal'),
    LensModel: extractValueFromClientMeta('LensModel')
  };
}

/**
 * 안전하게 숫자로 변환하는 유틸리티 함수들
 */
function parseFloatSafe(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = parseFloat(String(value).replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

function parseIntSafe(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const num = parseInt(String(value).replace(/[^\d]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * 이미지 압축 함수 - 해상도는 유지하면서 품질 조정으로 용량 감소
 * @param buffer 이미지 버퍼
 * @param mimeType 이미지 MIME 타입
 * @param isMobile 모바일 디바이스 여부
 * @returns 압축된 이미지 버퍼
 */
async function compressImage(buffer: Buffer, mimeType: string, isMobile: boolean = false): Promise<Buffer> {
  try {
    // Vercel API 크기 제한 (4.5MB)
    const VERCEL_SIZE_LIMIT = 4.5 * 1024 * 1024;

    // JPEG, PNG, WebP 등 이미지 형식에 따라 처리
    const sharpInstance = sharp(buffer);
    
    // 이미지의 메타데이터를 얻어 크기를 확인
    const metadata = await sharpInstance.metadata();
    
    // If metadata couldn't be obtained, return the original buffer
    if (!metadata) {
      console.warn('Could not get image metadata, using original image');
      return buffer;
    }
    
    // Progressive compression function
    const compressWithQuality = async (quality: number, maxAttempts = 5): Promise<Buffer> => {
      // 초기 압축 시도
      let compressedBuffer: Buffer;
      let currentQuality = quality;
      
      // 차원 계산
      let width = metadata.width;
      let height = metadata.height;
      
      // 매우 큰 이미지의 경우 해상도 감소
      const MAX_DIMENSION = isMobile ? 2500 : 3000; // 모바일은 더 작게 리사이징
      let resize = false;
      
      if (width && height && (width > MAX_DIMENSION || height > MAX_DIMENSION)) {
        resize = true;
        if (width > height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          let pipeline = sharpInstance.clone();
          
          // 필요한 경우 크기 조정
          if (resize) {
            pipeline = pipeline.resize(width, height);
          }
          
          // 모든 메타데이터 유지하도록 설정
          pipeline = pipeline.withMetadata();
          
          if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
            compressedBuffer = await pipeline.jpeg({ quality: Math.round(currentQuality * 100), mozjpeg: true }).toBuffer();
          } else if (mimeType === 'image/png') {
            // PNG 형식 유지하면서 압축 (메타데이터 보존을 위해)
            compressedBuffer = await pipeline.png({
              compressionLevel: 9,
              adaptiveFiltering: true,
              quality: Math.min(Math.round(currentQuality * 100), 90)
            }).toBuffer();
          } else if (mimeType === 'image/webp') {
            compressedBuffer = await pipeline.webp({ quality: Math.round(currentQuality * 100) }).toBuffer();
          } else {
            // 그 외 형식은 원본 형식 유지하면서 압축
            if (mimeType.includes('image/')) {
              const format = mimeType.split('/')[1];
              // 지원되는 포맷에 대해서만 처리
              if (['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'gif'].includes(format)) {
                compressedBuffer = await pipeline.toFormat(format as keyof sharp.FormatEnum, {
                  quality: Math.round(currentQuality * 100)
                }).toBuffer();
              } else {
                // 지원되지 않는 포맷은 JPEG로 변환
                compressedBuffer = await pipeline.jpeg({ quality: Math.round(currentQuality * 100) }).toBuffer();
              }
            } else {
              // 알 수 없는 포맷이면 JPEG로 변환
              compressedBuffer = await pipeline.jpeg({ quality: Math.round(currentQuality * 100) }).toBuffer();
            }
          }
          
          // 압축된 버퍼가 충분히 작은지 확인
          if (compressedBuffer.length <= VERCEL_SIZE_LIMIT || currentQuality <= 0.1) {
            console.log(`서버 압축 완료: ${(compressedBuffer.length / (1024 * 1024)).toFixed(2)}MB (품질: ${currentQuality.toFixed(1)})`);
            return compressedBuffer;
          }
          
          // 품질 감소 및 재시도
          currentQuality = Math.max(currentQuality - 0.1, 0.1);
          console.log(`서버 압축 시도 ${attempt+1}: ${(compressedBuffer.length / (1024 * 1024)).toFixed(2)}MB, 다음 품질: ${currentQuality.toFixed(1)}`);
          
          // 최저 품질에 도달하고 여전히 크기가 크다면, 해상도 감소 시도
          if (currentQuality <= 0.1 && attempt === maxAttempts - 2 && width && height) {
            console.log('최저 품질로도 충분히 작아지지 않음, 해상도 추가 감소');
            width = Math.round(width * 0.7);
            height = Math.round(height * 0.7);
            resize = true;
          }
        } catch (err) {
          console.error(`압축 시도 ${attempt+1} 실패:`, err);
          if (attempt === maxAttempts - 1) throw err;
        }
      }
      
      // 모든 시도가 실패하면 마지막으로 생성된 버퍼 반환
      if (compressedBuffer!) {
        return compressedBuffer!;
      }
      
      // 모든 압축 시도가 실패하면 원본 반환
      console.warn('모든 압축 시도 실패, 원본 반환');
      return buffer;
    };
    
    // 이미지 크기에 따른 초기 품질 설정
    const isLargeImage = metadata.width && metadata.height && 
      (metadata.width > 3000 || metadata.height > 3000 || buffer.length > 10 * 1024 * 1024);
    
    // 초기 품질값 - 큰 이미지는 더 공격적으로 압축, 모바일은 더 낮은 품질로 시작
    const initialQuality = isLargeImage ? 0.4 : (isMobile ? 0.6 : 0.7);
    
    return await compressWithQuality(initialQuality, isMobile ? 4 : 5);
  } catch (error) {
    console.error('Error in compressImage function:', error);
    // Return original buffer on error
    return buffer;
  }
}
