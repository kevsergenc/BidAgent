import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendTemporaryPasswordEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Lütfen kayıtlı e-posta adresinizi giriniz." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Bu e-posta adresiyle kayıtlı bir hesap bulunamadı." },
        { status: 404 }
      );
    }

    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const tempPassword = `BA-${randomSuffix}`;

    const hashedTempPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedTempPassword,
        tempPassword: true,
      },
    });

    const emailResult = await sendTemporaryPasswordEmail(user.email, tempPassword);

    return NextResponse.json({
      message: `Geçici şifreniz ${user.email} adresine gönderildi. Lütfen gelen kutunuzu kontrol edin.`,
      tempPassword: tempPassword, 
      simulated: emailResult.simulated,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Şifre sıfırlama işlemi sırasında bir hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

