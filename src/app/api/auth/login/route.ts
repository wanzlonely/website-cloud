/**
 * WALZ EXPLOIT - Auth Login API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey } = body;

    if (!licenseKey) {
      return NextResponse.json(
        { success: false, message: 'License key is required' },
        { status: 400 }
      );
    }

    const key = await db.licenseKey.findUnique({
      where: { key: licenseKey }
    });

    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Invalid license key' },
        { status: 401 }
      );
    }

    if (!key.isActive) {
      return NextResponse.json(
        { success: false, message: 'License key is deactivated' },
        { status: 401 }
      );
    }

    if (key.expiresAt && new Date() > key.expiresAt) {
      return NextResponse.json(
        { success: false, message: 'License key has expired' },
        { status: 401 }
      );
    }

    if (key.type === 'single' && key.currentUses >= key.maxUses) {
      return NextResponse.json(
        { success: false, message: 'License key has already been used' },
        { status: 401 }
      );
    }

    const token = generateToken();
    const sessionId = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await db.user.create({
      data: {
        licenseKeyId: key.id,
        sessionId,
        sessions: {
          create: {
            token,
            expiresAt
          }
        }
      }
    });

    await db.licenseKey.update({
      where: { id: key.id },
      data: { currentUses: { increment: 1 } }
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        sessionId,
        expiresAt,
        isAdmin: user.isAdmin
      }
    });

    response.cookies.set('walz_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
