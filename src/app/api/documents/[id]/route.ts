import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// GET /api/documents/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        chats: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Döküman bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Döküman getirilirken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Döküman bulunamadı." }, { status: 404 });
    }

    // Remove file from disk
    const filePath = path.join(UPLOAD_DIR, document.fileName);
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.warn("Could not delete file from disk:", err);
      }
    }

    await prisma.document.delete({
      where: { id: document.id },
    });

    return NextResponse.json({ message: "Döküman başarıyla silindi." });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Döküman silinirken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

