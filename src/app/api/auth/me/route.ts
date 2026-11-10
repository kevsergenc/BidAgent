import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Also fetch last 5 login logs for the user
    const loginLogs = await prisma.loginLog.findMany({
      where: { userId: user.id },
      orderBy: { loginAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      user: {
        ...user,
        lastLogins: loginLogs,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Kullanıcı bilgisi alınamadı: " + error.message },
      { status: 500 }
    );
  }
}

