import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    web_apps: [
      {
        manifest: 'https://meova.in/manifest.json',
        details: {
          paths: ['/*']
        }
      },
      {
        manifest: 'https://app.meova.in/manifest.json',
        details: {
          paths: ['/*']
        }
      }
    ]
  };

  return NextResponse.json(data, {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=86400',
    },
  });
}
