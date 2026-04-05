import { db } from "../db";
import { users } from "../db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seed başlıyor...");

  const email = "admin@yoklama.com";
  const password = "admin1234";
  const name = "Yönetici";

  const hash = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({ email, passwordHash: hash, name });
    console.log("✅ Admin kullanıcı oluşturuldu:");
    console.log(`   Email   : ${email}`);
    console.log(`   Şifre   : ${password}`);
  } catch {
    console.log("ℹ️  Admin kullanıcı zaten mevcut.");
  }

  console.log("✅ Seed tamamlandı.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed hatası:", err);
  process.exit(1);
});
