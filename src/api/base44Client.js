/**
 * Base44-compatible client — re-exports from our self-hosted API client.
 *
 * This file exists so existing code importing from '@/api/base44Client'
 * continues to work without changes. The real implementation is in client.js.
 *
 * Usage: import { base44, setTokens, getAccessToken } from '@/api/base44Client'
 */
export { base44, setTokens, getAccessToken, clearTokens } from './client.js';
