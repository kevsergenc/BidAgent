import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Yetkisiz erişim.", { status: 401 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!document) {
      return new NextResponse("Döküman bulunamadı.", { status: 404 });
    }

    const filePath = path.join(UPLOAD_DIR, document.fileName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Döküman dosyası sunucuda bulunamadı.", { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.title)}.pdf"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    return new NextResponse("Dosya okunurken bir hata oluştu: " + error.message, {
      status: 500,
    });
  }
}

