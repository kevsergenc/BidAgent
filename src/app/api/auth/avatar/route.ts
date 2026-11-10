import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const AVATARS_DIR = path.join(process.cwd(), "uploads", "avatars");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("f");

    if (!fileName) {
      return new NextResponse("Dosya belirtilmedi.", { status: 400 });
    }

    // Prevent directory traversal
    const safeFileName = path.basename(fileName);
    const filePath = path.join(AVATARS_DIR, safeFileName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Fotoğraf bulunamadı.", { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const ext = safeFileName.split(".").pop()?.toLowerCase();
    let contentType = "image/jpeg";
    if (ext === "png") contentType = "image/png";
    if (ext === "webp") contentType = "image/webp";
    if (ext === "gif") contentType = "image/gif";
    if (ext === "svg") contentType = "image/svg+xml";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    return new NextResponse("Hata: " + error.message, { status: 500 });
  }
}

