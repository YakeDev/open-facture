import prisma from './prisma.js'

export const invalidateUserSessions = async (userId) => {
	if (!userId) return null

	return prisma.user.update({
		where: { id: userId },
		data: { tokenVersion: { increment: 1 } },
		select: { id: true, tokenVersion: true },
	})
}
