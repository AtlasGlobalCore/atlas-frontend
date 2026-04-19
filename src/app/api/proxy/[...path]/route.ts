/**
 * NeXFlowX API Proxy
 *
 * Catch-all Next.js API route that forwards requests to the live backend
 * at https://api.nexflowx.tech/api/v1/.
 *
 * This avoids CORS issues and keeps the JWT token handling server-side.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = 'https://api.nexflowx.tech/api/v1';

// Paths that should NOT require a JWT (public endpoints)
const PUBLIC_PATHS = ['/auth/login'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const path = pathSegments.join('/');
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const targetUrl = `${BACKEND_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`;

  // Build forwarding headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward Authorization header from client if present
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Also forward x-api-key if present (for API key auth)
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    headers['x-api-key'] = apiKeyHeader;
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Forward body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const body = await request.text();
    if (body) {
      fetchOptions.body = body;
    }
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);

    // Get response body
    const responseText = await response.text();
    let responseBody: unknown;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }

    return NextResponse.json(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(`[PROXY ERROR] ${method} /${path}:`, error);
    return NextResponse.json(
      {
        error: {
          code: 'PROXY_ERROR',
          message: 'Erro de comunicação com o servidor. Tente novamente.',
        },
      },
      { status: 502 }
    );
  }
}
