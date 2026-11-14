import { readFileSync } from "node:fs";

/**
 * A text file a person may have saved by hand: UTF-8 with or without a byte order mark, or
 * UTF-16 with one (what PowerShell 5.1's `>` and Notepad's "Unicode" write). The mark is dropped.
 */
export function readText(file: string): string {
  const bytes = readFileSync(file);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return bytes.subarray(2).toString("utf16le");
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return Buffer.from(bytes.subarray(2)).swap16().toString("utf16le");
  const text = bytes.toString("utf8");
  return text.startsWith("﻿") ? text.slice(1) : text;
}
