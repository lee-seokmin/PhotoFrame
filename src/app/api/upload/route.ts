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
    
    if (clientMetadataString) {
      try {
        clientMetadata = JSON.parse(clientMetadataString);
        console.log('클라이언트에서 전달된 메타데이터:', clientMetadata);
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
      try {
        // exifr로 메타데이터 추출 시도
        metadata = await exifr.parse(Buffer.from(buffer));
      } catch (exifrError) {
        console.error('exifr로 메타데이터 추출 실패:', exifrError);
      }
      
      // exifr로 메타데이터 추출에 실패했고, 클라이언트 메타데이터가 있으면 사용
      if (!metadata && clientMetadata) {
        console.log('서버 메타데이터 추출 실패, 클라이언트 메타데이터 사용');
        
        // 클라이언트에서 전달된 메타데이터에서 필요한 정보 추출
        try {
          metadata = {
            Make: clientMetadata.Make?.description || null,
            Model: clientMetadata.Model?.description || null,
            ExposureTime: clientMetadata.ExposureTime?.description ? 
              parseFloat(clientMetadata.ExposureTime.description) : null,
            ISO: clientMetadata.ISOSpeedRatings?.description ? 
              parseInt(clientMetadata.ISOSpeedRatings.description) : null,
            FNumber: clientMetadata.FNumber?.description ? 
              parseFloat(clientMetadata.FNumber.description) : null,
            FocalLength: clientMetadata.FocalLength?.description ? 
              parseFloat(clientMetadata.FocalLength.description) : null,
            DateTimeOriginal: clientMetadata.DateTimeOriginal?.description || null,
            LensModel: clientMetadata.LensModel?.description || null
          };
        } catch (clientMetadataError) {
          console.error('클라이언트 메타데이터 변환 오류:', clientMetadataError);
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
          imageBuffer = await compressImage(Buffer.from(buffer), file.type);
          
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
 * 이미지 압축 함수 - 해상도는 유지하면서 품질 조정으로 용량 감소
 * @param buffer 이미지 버퍼
 * @param mimeType 이미지 MIME 타입
 * @returns 압축된 이미지 버퍼
 */
async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
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
      const MAX_DIMENSION = 3000; // 적정 최대 크기
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
            console.log(`서버 압축 완료: ${(compressedBuffer.length / (1024 * 1024)).toFixed(2)}MB, 품질: ${currentQuality.toFixed(1)}`);
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
    
    // 초기 품질값 - 큰 이미지는 더 공격적으로 압축
    const initialQuality = isLargeImage ? 0.5 : 0.8;
    
    return await compressWithQuality(initialQuality);
  } catch (error) {
    console.error('Error in compressImage function:', error);
    // Return original buffer on error
    return buffer;
  }
}
