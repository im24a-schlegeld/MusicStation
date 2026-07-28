"use client";

import { upload } from "@vercel/blob/client";
import { useEffect } from "react";

declare global {
  interface Window {
    archiveUploadBlob?: (
      pathname: string,
      file: File,
      uploadCode: string,
      onProgress?: (percentage: number) => void,
    ) => Promise<{ url: string }>;
  }
}

export function BlobBridge() {
  useEffect(() => {
    window.archiveUploadBlob = async (pathname, file, uploadCode, onProgress) => {
      return upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/blob",
        clientPayload: JSON.stringify({ uploadCode }),
        multipart: file.size > 100 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => onProgress?.(percentage),
      });
    };

    return () => {
      delete window.archiveUploadBlob;
    };
  }, []);

  return null;
}
