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
    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. 최대 30MB까지 업로드 가능합니다.' },
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
      } catch (compressError) {
        console.error('Image compression error:', compressError);
        return NextResponse.json(
          { error: '이미지 압축 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.' },
          { status: 500 }
        );
      }
      
      // Create a base64 representation of the compressed image for frontend use
      const base64Image = compressedImageBuffer.toString('base64');
      const imageType = file.type;
      const dataUrl = `data:${imageType};base64,${base64Image}`;
      
      // Return the metadata and image data
      return NextResponse.json({ 
        filteredMetadata,
        imageData: {
          dataUrl,
          type: imageType,
          name: file.name.split('.')[0]
        }
      });
    } catch (metadataError) {
      console.error('Metadata extraction error:', metadataError);
      // 메타데이터 추출 실패해도 이미지 처리는 계속 진행
      try {
        const compressedImageBuffer = await compressImage(Buffer.from(buffer), file.type);
        const base64Image = compressedImageBuffer.toString('base64');
        const imageType = file.type;
        const dataUrl = `data:${imageType};base64,${base64Image}`;
        
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
            type: imageType,
            name: file.name.split('.')[0]
          }
        });
      } catch (compressError) {
        console.error('Image compression error:', compressError);
        return NextResponse.json(
          { error: '이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.' },
          { status: 500 }
        );
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
  // JPEG, PNG, WebP 등 이미지 형식에 따라 처리
  const sharpInstance = sharp(buffer);
  
  // 이미지의 메타데이터를 얻어 크기를 확인
  const metadata = await sharpInstance.metadata();
  const isLargeImage = metadata.width && metadata.height && 
    (metadata.width > 3000 || metadata.height > 3000 || buffer.length > 10 * 1024 * 1024);
  
  // 크기에 따라 압축 수준 조정
  const jpegQuality = isLargeImage ? 70 : 80;
  const webpQuality = isLargeImage ? 70 : 80;
  
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    // JPEG의 경우 품질 조정
    return await sharpInstance
      .jpeg({ quality: jpegQuality, mozjpeg: true })
      .toBuffer();
  } else if (mimeType === 'image/png') {
    // PNG의 경우 압축 레벨 조정 또는 JPEG로 변환 (용량 감소에 더 효과적)
    if (isLargeImage) {
      return await sharpInstance
        .jpeg({ quality: jpegQuality, mozjpeg: true })
        .toBuffer();
    } else {
      return await sharpInstance
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
    }
  } else if (mimeType === 'image/webp') {
    // WebP의 경우 품질 조정
    return await sharpInstance
      .webp({ quality: webpQuality })
      .toBuffer();
  } else if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    // HEIC/HEIF 형식은 JPEG로 변환
    return await sharpInstance
      .jpeg({ quality: jpegQuality, mozjpeg: true })
      .toBuffer();
  } else {
    // 그 외 형식은 JPEG로 변환하여 압축
    return await sharpInstance
      .jpeg({ quality: 75 })
      .toBuffer();
  }
}
