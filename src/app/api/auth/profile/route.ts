import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const AVATARS_DIR = path.join(process.cwd(), "uploads", "avatars");

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// GET /api/auth/profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: dbUser });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Profil bilgisi alınamadı: " + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/auth/profile - Update name, surname, and optionally profile image
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    let name = user.name;
    let surname = user.surname;
    let imageUrl = user.image;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const formName = formData.get("name") as string | null;
      const formSurname = formData.get("surname") as string | null;
      const file = formData.get("avatar") as File | null;

      if (formName !== null) name = formName.trim();
      if (formSurname !== null) surname = formSurname.trim();

      if (file && file.size > 0) {
        const ext = file.name.split(".").pop() || "png";
        const fileName = `${user.id}-${Date.now()}.${ext}`;
        const filePath = path.join(AVATARS_DIR, fileName);

        const bytes = await file.arrayBuffer();
        await fs.promises.writeFile(filePath, Buffer.from(bytes));

        imageUrl = `/api/auth/avatar?f=${fileName}`;
      }
    } else {
      const body = await request.json();
      if (body.name !== undefined) name = body.name ? body.name.trim() : null;
      if (body.surname !== undefined) surname = body.surname ? body.surname.trim() : null;
      if (body.image !== undefined) imageUrl = body.image;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        surname,
        image: imageUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Profil bilgileriniz başarıyla güncellendi.",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Profil güncellenirken hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}

