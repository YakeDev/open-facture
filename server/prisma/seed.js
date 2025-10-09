import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
	const email = 'admin@openfacture.com'
	const password = 'Password123!'
	const passwordHash = await bcrypt.hash(password, 12)

	await prisma.user.upsert({
		where: { email },
		update: { passwordHash, name: 'Admin', role: 'admin' },
		create: { email, passwordHash, name: 'Admin', role: 'admin' },
	})

	console.log('✅ Utilisateur admin créé !')
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
