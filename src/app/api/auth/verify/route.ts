/**
 * WALZ EXPLOIT - Auth Verify API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('walz_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }

    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            licenseKey: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }

    if (new Date() > session.expiresAt) {
      await db.session.delete({ where: { id: session.id } });
      return NextResponse.json(
        { success: false, authenticated: false, message: 'Session expired' },
        { status: 401 }
      );
    }

    // Update last active
    await db.user.update({
      where: { id: session.userId },
      data: { lastActive: new Date() }
    });

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: {
        isAdmin: session.user.isAdmin,
        licenseKey: {
          type: session.user.licenseKey.type,
          expiresAt: session.user.licenseKey.expiresAt
        }
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { success: false, authenticated: false },
      { status: 500 }
    );
  }
}
