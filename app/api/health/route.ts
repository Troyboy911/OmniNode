import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Omni Node Frontend is running',
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
}