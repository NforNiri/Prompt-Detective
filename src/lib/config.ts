// Application configuration constants

/**
 * Base URL for puzzle images in Vercel Blob storage.
 * Images are stored with their bare filename (e.g. "abc123.webp").
 * Can be overridden via NEXT_PUBLIC_BLOB_BASE_URL env var.
 */
export const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? "https://vqbp3tbbajbstqiy.public.blob.vercel-storage.com";

export const PUZZLE_BUCKET = "puzzles";
