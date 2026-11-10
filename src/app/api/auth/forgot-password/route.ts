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

    // Generate a secure temporary password (e.g. "BA-" + random 6 characters uppercase/digits)
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const tempPassword = `BA-${randomSuffix}`;

    // Hash the temporary password and update the user
    const hashedTempPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedTempPassword,
        tempPassword: true,
      },
    });

    // Send email with the temporary password
    const emailResult = await sendTemporaryPasswordEmail(user.email, tempPassword);

    return NextResponse.json({
      message: `Geçici şifreniz ${user.email} adresine gönderildi. Lütfen gelen kutunuzu kontrol edin.`,
      tempPassword: tempPassword, // Provided so user can test immediately in development
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

