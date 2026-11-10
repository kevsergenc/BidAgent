import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPdfPageCount } from "@/lib/pdf";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// GET /api/documents - List documents with optional search query
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    const documents = await prisma.document.findMany({
      where: {
        userId: user.id,
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { fileName: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Fetch documents error:", error);
    return NextResponse.json(
      { error: "Dökümanlar yüklenirken bir hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

// POST /api/documents - Upload PDF document
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Lütfen bir PDF dosyası seçin." }, { status: 400 });
    }

    // Validate that it is indeed a PDF file
    const fileName = file.name;
    const isPdf =
      file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        { error: "Sadece PDF formatındaki dosyalar kabul edilmektedir." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Calculate actual page count of PDF using pdf-lib
    const pageCount = await getPdfPageCount(buffer);

    // Generate unique file name on disk
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const diskFileName = `${uniquePrefix}-${sanitizedFileName}`;
    const destinationPath = path.join(UPLOAD_DIR, diskFileName);

    await fs.promises.writeFile(destinationPath, buffer);

    // Save document to database
    const document = await prisma.document.create({
      data: {
        userId: user.id,
        title: fileName.replace(/\.pdf$/i, ""),
        fileName: diskFileName,
        fileSize: buffer.length,
        pageCount: pageCount > 0 ? pageCount : 1,
      },
    });

    return NextResponse.json({
      message: "PDF dökümanı başarıyla yüklendi.",
      document,
    });
  } catch (error: any) {
    console.error("Upload document error:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

