// pages/api/upload.js
import { NextRequest, NextResponse } from 'next/server';
import exifr from 'exifr';

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

    // Convert the file to an ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Extract metadata using exifr
    const metadata = await exifr.parse(Buffer.from(buffer));
    const filteredMetadata = {
      Make: metadata?.Make || null,
      Model: metadata?.Model || null,
      ExposureTime: metadata?.ExposureTime || null,
      ISO: metadata?.ISO || null,
      FNumber: metadata?.FNumber || null,
      FocalLength: metadata?.FocalLength || null,
      DateTimeOriginal: metadata?.DateTimeOriginal || null
    };
    
    // Create a base64 representation of the image for frontend use
    const base64Image = Buffer.from(buffer).toString('base64');
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
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Error processing file' },
      { status: 500 }
    );
  }
}
