import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || "{}") as { uploadCode?: string };
        if (!process.env.UPLOAD_CODE || payload.uploadCode !== process.env.UPLOAD_CODE) {
          throw new Error("Invalid upload code");
        }

        return {
          allowedContentTypes: ["audio/*", "image/*"],
          maximumSizeInBytes: 1024 * 1024 * 1024,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
      onUploadCompleted: async () => undefined,
    });
    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload authorization failed" },
      { status: 400 },
    );
  }
}
