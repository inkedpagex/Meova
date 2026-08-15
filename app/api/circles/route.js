import { NextResponse } from 'next/server';
import { fetchCirclesAdmin } from '../../../lib/firebaseAdminQueries';

export const revalidate = 30; // 30 seconds cache

export async function GET() {
  try {
    const circles = await fetchCirclesAdmin();
    return NextResponse.json({ circles: circles || [] });
  } catch (err) {
    return NextResponse.json({ circles: [] });
  }
}
