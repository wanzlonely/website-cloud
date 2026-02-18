/**
 * WALZ EXPLOIT - Admin Keys API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'WALZ-';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) key += '-';
  }
  return key;
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('walz_token')?.value;
  if (!token) return false;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true }
  });

  return session?.user?.isAdmin === true;
}

// GET - List all license keys
export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const keys = await db.licenseKey.findMany({
      include: {
        users: {
          select: {
            id: true,
            lastActive: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: keys
    });
  } catch (error) {
    console.error('Get keys error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new license key
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type = 'single', maxUses = 1, expiresAt } = body;

    const key = await db.licenseKey.create({
      data: {
        key: generateLicenseKey(),
        type,
        maxUses: type === 'multi' ? (maxUses || 999) : 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'License key created',
      data: key
    });
  } catch (error) {
    console.error('Create key error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete license key
export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Key ID required' },
        { status: 400 }
      );
    }

    await db.licenseKey.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'License key deleted'
    });
  } catch (error) {
    console.error('Delete key error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle key active status
export async function PATCH(request: NextRequest) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Key ID required' },
        { status: 400 }
      );
    }

    const key = await db.licenseKey.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json({
      success: true,
      message: `License key ${isActive ? 'activated' : 'deactivated'}`,
      data: key
    });
  } catch (error) {
    console.error('Toggle key error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
