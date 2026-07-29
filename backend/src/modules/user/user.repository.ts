import { prisma } from "../../config/db";

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const createUser = (data: { email: string; password: string }) => {
  return prisma.user.create({ data });
};

export const findUserById = (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

export const updateUserRefreshToken = (id: string, refreshToken: string | null) => {
  return prisma.user.update({
    where: { id },
    data: { refreshToken },
  });
};
