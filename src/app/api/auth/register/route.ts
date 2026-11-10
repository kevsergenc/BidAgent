import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-posta ve şifre alanları zorunludur." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check unique email constraint
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta adresi ile zaten kayıtlı bir hesap bulunmaktadır. Lütfen giriş yapın veya şifrenizi sıfırlayın." },
        { status: 409 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifreniz en az 6 karakter uzunluğunda olmalıdır." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    let firstName = trimmedEmail.split("@")[0];
    let lastName = "";
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length > 1) {
        lastName = parts.pop() || "";
        firstName = parts.join(" ");
      } else {
        firstName = parts[0];
      }
    }

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        password: hashedPassword,
        name: firstName,
        surname: lastName,
      },
    });

    // Record initial registration/login timestamp in database
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Bilinmeyen Tarayıcı";

    await prisma.loginLog.create({
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

    const response = NextResponse.json(
      {
        message: "Kayıt başarılı! Hoş geldiniz.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          image: user.image,
        },
      },
      { status: 201 }
    );

    // Set cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Kayıt işlemi sırasında bir hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

