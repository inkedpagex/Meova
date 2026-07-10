import { NextResponse } from 'next/server';

export async function GET() {
  const pk = process.env.FIREBASE_PRIVATE_KEY || '';
  
  const debugInfo = {
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    projectId: process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    privateKeyLength: pk.length,
    privateKeyStartsWith: pk.substring(0, 15),
    privateKeyEndsWith: pk.substring(pk.length - 15),
    privateKeyHasLiteralNewline: pk.includes('\\n'),
    privateKeyHasActualNewline: pk.includes('\n'),
    privateKeyHasQuotes: pk.includes('"') || pk.includes("'"),
    
    // Testing the exact sanitization we do:
    sanitized: pk
      .replace(/^['"]|['"]$/g, '')
      .replace(/\\n/g, '\n')
      .trim()
      .substring(0, 15),
      
    sanitizedLength: pk
      .replace(/^['"]|['"]$/g, '')
      .replace(/\\n/g, '\n')
      .trim().length,
  };

  return NextResponse.json(debugInfo);
}
