import { NextResponse } from 'next/server'; import { cookies } from 'next/headers'; export async function GET() { return NextResponse.json({ ok: true }); }
