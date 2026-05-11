import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create Admin User
  // Note: For this to work with login, you MUST also create this user in Supabase Auth
  // with the same email and password (admin123). 
  // Once the user signs up/is created in Supabase, their ID will be used here.
  
  // Since we don't know the Supabase ID yet, we'll create a placeholder if it doesn't exist,
  // OR you can sign up first and then run this seed to upgrade your role to ADMIN.
  
  const adminEmail = 'admin@gmail.com'
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      name: 'Super Admin'
    },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      role: 'ADMIN',
      // We use a temporary ID if not found, but it should ideally be the Supabase UID
      id: 'admin-placeholder-id' 
    },
  })

  console.log({ admin })
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
