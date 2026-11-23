import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
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
      {
        error:
          "Dökümanlar yüklenirken bir hata oluştu: " + error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Lütfen bir PDF dosyası seçin." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Sadece PDF formatındaki dosyalar kabul edilmektedir." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Seçilen dosya boş." },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Dosya boyutu 50 MB sınırını aşamaz." },
        { status: 400 }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file, file.name);

    const backendUrl =
      `${process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000"}` +
      "/api/v1/documents/upload";

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
      body: backendFormData,
      cache: "no-store",
    });

    const backendData = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          error:
            backendData?.detail ||
            "PDF backend üzerinden yüklenemedi.",
        },
        { status: backendResponse.status }
      );
    }

    const documentId = backendData?.document_id;

    if (!documentId) {
      return NextResponse.json(
        { error: "Backend belge kimliği döndürmedi." },
        { status: 500 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.userId !== user.id) {
      return NextResponse.json(
        { error: "Yüklenen belge veritabanında doğrulanamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: backendData.message || "PDF başarıyla yüklendi.",
      document,
      duplicate: backendData.duplicate || false,
      chunk_count: backendData.chunk_count || 0,
    });
  } catch (error: any) {
    console.error("Upload document error:", error);

    return NextResponse.json(
      {
        error: "Dosya yüklenirken bir hata oluştu: " + error.message,
      },
      { status: 500 }
    );
  }
}


