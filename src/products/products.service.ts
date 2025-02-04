import { promises as fs } from 'fs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductRequest } from './dto/create-product.request';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { PRODUCT_IMAGES } from './product-images';
import { Prisma } from '@prisma/client';
import { ProductsGateWay } from './products.gateway';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productsGateWay: ProductsGateWay,
  ) {}

  async createProduct(data: CreateProductRequest, userId: number) {
    const product = await this.prismaService.product.create({
      data: {
        ...data,
        userId,
      },
    });
    this.productsGateWay.handleProductUpdated();
    return product;
  }

  async getProducts(status?: string) {
    const args: Prisma.ProductFindManyArgs = {};
    if (status === 'available') {
      args.where = { sold: false };
    }
    const products = await this.prismaService.product.findMany(args);
    return Promise.all(
      products.map(async (product) => ({
        ...product,
        imageExist: await this.imageExist(product.id),
      })),
    );
  }

  async getProduct(productId: number) {
    try {
      return {
        ...(await this.prismaService.product.findUniqueOrThrow({
          where: { id: productId },
        })),
        imageExist: await this.imageExist(productId),
      };
    } catch (error) {
      throw new NotFoundException(`Product not found with ID ${productId}`);
    }
  }

  async update(productId: number, data: Prisma.ProductUpdateInput) {
    await this.prismaService.product.update({
      where: { id: productId },
      data,
    });
    this.productsGateWay.handleProductUpdated();
  }

  private async imageExist(productsId: number) {
    try {
      await fs.access(
        join(`${PRODUCT_IMAGES}/${productsId}.jpg`),
        fs.constants.F_OK,
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
