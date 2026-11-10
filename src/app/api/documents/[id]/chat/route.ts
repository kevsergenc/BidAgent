import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/documents/[id]/chat - Get all chat messages for a document
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
      where: { id: params.id, userId: user.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Döküman bulunamadı." }, { status: 404 });
    }

    const chats = await prisma.chatMessage.findMany({
      where: { documentId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ chats });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Sohbet mesajları getirilirken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

// POST /api/documents/[id]/chat - Ask a question
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const document = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Döküman bulunamadı." }, { status: 404 });
    }

    const body = await request.json();
    const { question } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Lütfen bir soru yazınız." }, { status: 400 });
    }

    // Per user requirement:
    // "eğer kullanıcı chat kısmına soru yazıp ok tuşuna basarsa chat kısmının üstünde yanıt alanı açılacak(bu alan şimdilik boş kalsın)"
    const chat = await prisma.chatMessage.create({
      data: {
        documentId: params.id,
        sender: "user",
        question: question.trim(),
        answer: "", // Kept empty as requested
      },
    });

    return NextResponse.json({
      message: "Soru kaydedildi.",
      chat,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Soru gönderilirken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

