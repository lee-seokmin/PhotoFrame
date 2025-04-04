import { NextRequest, NextResponse } from 'next/server';
import exifr from 'exifr';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
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
    
    try {
      // Extract metadata using exifr
      const metadata = await exifr.parse(Buffer.from(buffer));
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
      
      // 이미지 압축 - 해상도는 유지하면서 용량 감소
      let compressedImageBuffer;
      try {
        compressedImageBuffer = await compressImage(Buffer.from(buffer), file.type);
        
        // Check if compression was effective (more than 10% reduction)
        // If not effective, just use the original
        if (compressedImageBuffer.length > buffer.byteLength * 0.9) {
          console.log('Compression not effective, using original buffer');
          compressedImageBuffer = Buffer.from(buffer);
        }
      } catch (compressError) {
        console.error('Image compression error:', compressError);
        // Use original buffer as fallback instead of failing
        console.warn('Using original uncompressed image as fallback');
        compressedImageBuffer = Buffer.from(buffer);
      }
      
      // Create a base64 representation of the compressed image for frontend use
      let base64Image, dataUrl;
      try {
        base64Image = compressedImageBuffer.toString('base64');
        const imageType = file.type;
        dataUrl = `data:${imageType};base64,${base64Image}`;
      } catch (encodingError) {
        console.error('Base64 encoding error:', encodingError);
        return NextResponse.json(
          { error: '이미지 인코딩 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.' },
          { status: 500 }
        );
      }
      console.log(metadata);
      // Return the metadata and image data
      return NextResponse.json({ 
        filteredMetadata,
        imageData: {
          dataUrl,
          type: file.type,
          name: file.name.split('.')[0]
        }
      });
    } catch (metadataError) {
      console.error('Metadata extraction error:', metadataError);
      // 메타데이터 추출 실패해도 이미지 처리는 계속 진행
      try {
        const compressedImageBuffer = await compressImage(Buffer.from(buffer), file.type);
        
        // Check if compression was effective (more than 10% reduction)
        if (compressedImageBuffer.length > buffer.byteLength * 0.9) {
          console.log('Compression not effective, using original buffer');
          const originalBuffer = Buffer.from(buffer);
          
          // Create base64 from original buffer
          const base64Image = originalBuffer.toString('base64');
          const dataUrl = `data:${file.type};base64,${base64Image}`;
          
          return NextResponse.json({ 
            filteredMetadata: {
              Make: null,
              Model: null,
              ExposureTime: null,
              ISO: null,
              FNumber: null,
              FocalLength: null,
              DateTimeOriginal: null,
              LensModel: null
            },
            imageData: {
              dataUrl,
              type: file.type,
              name: file.name.split('.')[0]
            }
          });
        }
        
        // Create base64 from compressed buffer
        let base64Image, dataUrl;
        try {
          base64Image = compressedImageBuffer.toString('base64');
          dataUrl = `data:${file.type};base64,${base64Image}`;
        } catch (encodingError) {
          console.error('Base64 encoding error after metadata failure:', encodingError);
          return NextResponse.json(
            { error: '이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          filteredMetadata: {
            Make: null,
            Model: null,
            ExposureTime: null,
            ISO: null,
            FNumber: null,
            FocalLength: null,
            DateTimeOriginal: null,
            LensModel: null
          },
          imageData: {
            dataUrl,
            type: file.type,
            name: file.name.split('.')[0]
          }
        });
      } catch (compressError) {
        console.error('Image compression error after metadata failure:', compressError);
        
        // Last resort: try to use the original image without compression
        try {
          const base64Image = Buffer.from(buffer).toString('base64');
          const dataUrl = `data:${file.type};base64,${base64Image}`;
          
          return NextResponse.json({ 
            filteredMetadata: {
              Make: null,
              Model: null,
              ExposureTime: null,
              ISO: null,
              FNumber: null,
              FocalLength: null,
              DateTimeOriginal: null,
              LensModel: null
            },
            imageData: {
              dataUrl,
              type: file.type,
              name: file.name.split('.')[0]
            }
          });
        } catch (finalError) {
          console.error('Final fallback failed:', finalError);
          return NextResponse.json(
            { error: '이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.' },
            { status: 500 }
          );
        }
      }
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
