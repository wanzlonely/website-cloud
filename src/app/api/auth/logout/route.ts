/**
 * WALZ EXPLOIT - Auth Logout API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('walz_token')?.value;

    if (token) {
      await db.session.deleteMany({
        where: { token }
      }).catch(() => {});
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.delete('walz_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    const response = NextResponse.json({
      success: true,
      message: 'Logged out'
    });
    response.cookies.delete('walz_token');
    
    return response;
  }
}
