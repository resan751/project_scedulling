import { pbkdf2, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "./lib/prisma.js";

const pbkdf2Async = promisify(pbkdf2);

const users = [
  {
    nama: "Admin",
    role: "manager",
    email: "admin@gmail.com",
    password: "admin123",
  },
  {
    nama: "aan",
    role: "admin",
    email: "aangaming@gmail.com",
    password: "podowingi",
  },
  {
    nama: "rio",
    role: "user",
    email: "riobelly@gmail.com",
    password: "semarang",
  },
];

async function hashPassword(password) {
  const iterations = 100000;
  const salt = randomBytes(16).toString("base64");
  const hash = await pbkdf2Async(password, salt, iterations, 32, "sha256");

  return `pbkdf2$${iterations}$${salt}$${hash.toString("base64")}`;
}

async function main() {
  let created = 0;
  let updated = 0;

  for (const user of users) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: user.email,
      },
    });

    const data = {
      ...user,
      password: await hashPassword(user.password),
    };

    if (existingUser) {
      await prisma.user.update({
        where: {
          id_user: existingUser.id_user,
        },
        data,
      });
      updated += 1;
      continue;
    }

    await prisma.user.create({
      data,
    });
    created += 1;
  }

  console.log(`Seed selesai: ${created} user dibuat, ${updated} user diupdate.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
