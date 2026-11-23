import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    const document = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Doküman bulunamadı." },
        { status: 404 }
      );
    }

    const chats = await prisma.chatMessage.findMany({
      where: { documentId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Chat history error:", error);

    return NextResponse.json(
      { error: "Sohbet geçmişi yüklenemedi." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    const document = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Doküman bulunamadı." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const question =
      typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return NextResponse.json(
        { error: "Lütfen bir soru yazınız." },
        { status: 400 }
      );
    }

    if (question.length > 5000) {
      return NextResponse.json(
        { error: "Soru en fazla 5000 karakter olabilir." },
        { status: 400 }
      );
    }

    const backendUrl = (
      process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");

    const cookie = request.headers.get("cookie");

    const agentResponse = await fetch(
      `${backendUrl}/api/v1/agent/ask`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify({
          question,
          document_id: document.id,
        }),
        cache: "no-store",
      }
    );

    const agentData = await agentResponse.json();

    if (!agentResponse.ok) {
      console.error("FastAPI Agent error:", agentData);

      return NextResponse.json(
        {
          error:
            agentData.detail ||
            agentData.error ||
            "Agent soruyu yanıtlayamadı.",
        },
        { status: agentResponse.status }
      );
    }

    if (
      agentData.status !== "completed" ||
      typeof agentData.answer !== "string" ||
      !agentData.answer.trim()
    ) {
      return NextResponse.json(
        { error: "Agent geçerli bir yanıt üretemedi." },
        { status: 500 }
      );
    }

    const chat = await prisma.chatMessage.create({
      data: {
        documentId: document.id,
        sender: "user",
        question,
        answer: agentData.answer,
      },
    });

    return NextResponse.json({
      message: "Soru başarıyla yanıtlandı.",
      chat,
      sources: agentData.sources || [],
      planned_activities: agentData.planned_activities || [],
    });
  } catch (error) {
    console.error("Chat request error:", error);

    return NextResponse.json(
      { error: "Soru işlenirken beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}

