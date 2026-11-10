import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Bu e-posta adresiyle eşleşen bir kullanıcı bulunamadı." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Girdiğiniz şifre hatalı. Lütfen tekrar deneyin veya şifrenizi sıfırlayın." },
        { status: 401 }
      );
    }

    // Record login timestamp in database
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Bilinmeyen Tarayıcı";

    const log = await prisma.loginLog.create({
      data: {
        userId: user.id,
        ip,
        userAgent,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      message: "Giriş başarılı!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        image: user.image,
        lastLogin: log.loginAt,
        tempPassword: user.tempPassword,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Giriş işlemi sırasında bir hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

