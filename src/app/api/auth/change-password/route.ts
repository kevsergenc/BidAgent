import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Yeni şifreniz en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    // If current user is not on temporary password, verify old password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    if (currentPassword) {
      const isValid = await verifyPassword(currentPassword, dbUser.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Mevcut şifreniz hatalı." },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        tempPassword: false,
      },
    });

    return NextResponse.json({
      message: "Şifreniz başarıyla güncellendi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Şifre güncellenirken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

