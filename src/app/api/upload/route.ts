/**
 * WALZ EXPLOIT - File Upload API
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadsDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string || '';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const targetDir = path ? join(UPLOADS_DIR, path) : UPLOADS_DIR;
    
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    const filePath = join(targetDir, file.name);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        name: file.name,
        size: file.size,
        path: path ? `${path}/${file.name}` : file.name
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed' },
      { status: 500 }
    );
  }
}
