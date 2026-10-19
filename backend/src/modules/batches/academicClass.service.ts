import { prisma } from "../../config/prisma.js";
import { BadRequestError, NotFoundError } from "../../common/errors/appError.js";
import type { ClassCategory } from "@prisma/client";

export class AcademicClassService {
  static async listClasses(category?: ClassCategory) {
    const where: any = {};
    if (category) where.category = category;

    return prisma.academicClass.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: { select: { batches: true } },
      },
    });
  }

  static async getClassById(id: string) {
    const item = await prisma.academicClass.findUnique({
      where: { id },
      include: {
        batches: {
          where: { isPublic: true },
          select: { id: true, name: true, title: true, seatLimit: true, feeAmount: true, status: true },
        },
      },
    });
    if (!item) throw new NotFoundError("Academic class not found");
    return item;
  }

  static async createClass(data: {
    name: string;
    code: string;
    academicYear: string;
    category?: ClassCategory;
    displayOrder?: number;
  }) {
    const existing = await prisma.academicClass.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestError(`Class with code '${data.code}' already exists`);
    }

    return prisma.academicClass.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        academicYear: data.academicYear,
        category: data.category || "COLLEGE",
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  static async updateClass(
    id: string,
    data: {
      name?: string;
      code?: string;
      academicYear?: string;
      category?: ClassCategory;
      displayOrder?: number;
    }
  ) {
    const existing = await prisma.academicClass.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Academic class not found");

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const codeCheck = await prisma.academicClass.findUnique({
        where: { code: data.code.toUpperCase() },
      });
      if (codeCheck) throw new BadRequestError(`Class code '${data.code}' is already used`);
    }

    return prisma.academicClass.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.academicYear && { academicYear: data.academicYear }),
        ...(data.category && { category: data.category }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
      },
    });
  }

  static async deleteClass(id: string) {
    const existing = await prisma.academicClass.findUnique({
      where: { id },
      include: { _count: { select: { batches: true } } },
    });
    if (!existing) throw new NotFoundError("Academic class not found");
    if (existing._count.batches > 0) {
      throw new BadRequestError(
        `Cannot delete class because it has ${existing._count.batches} active batches linked.`
      );
    }

    return prisma.academicClass.delete({ where: { id } });
  }
}
