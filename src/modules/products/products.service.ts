import { prisma } from "@/lib/prisma";
import { CreateProductInput, UpdateProductInput } from "./products.validations";

export async function createProduct(
  artistId: string,
  data: CreateProductInput
) {
  return prisma.digitalProduct.create({
    data: {
      artistId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      productType: data.productType,
      fileUrl: data.fileUrl,
      thumbnailUrl: data.thumbnailUrl,
      previewUrl: data.previewUrl,
      isPublished: data.isPublished ?? false,
      maxDownloads: data.maxDownloads,
    },
  });
}

export async function updateProduct(
  productId: string,
  data: UpdateProductInput
) {
  return prisma.digitalProduct.update({
    where: { id: productId },
    data,
  });
}

export async function deleteProduct(productId: string) {
  return prisma.digitalProduct.delete({ where: { id: productId } });
}

export async function getProductById(productId: string) {
  return prisma.digitalProduct.findUnique({
    where: { id: productId },
    include: { artist: { select: { id: true, name: true, slug: true } } },
  });
}

export async function listArtistProducts(artistId: string) {
  return prisma.digitalProduct.findMany({
    where: { artistId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPublicProducts(artistId: string) {
  return prisma.digitalProduct.findMany({
    where: { artistId, isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { artist: { select: { id: true, name: true, slug: true } } },
  });
}
