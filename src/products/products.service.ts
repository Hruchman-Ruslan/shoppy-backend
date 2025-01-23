import { promises as fs } from 'fs';
import { Injectable } from '@nestjs/common';
import { CreateProductRequest } from './dto/create-product.request';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  async createProduct(data: CreateProductRequest, userId: number) {
    return this.prismaService.product.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async getProducts() {
    const products = await this.prismaService.product.findMany();
    return Promise.all(
      products.map(async (product) => ({
        ...product,
        imageExist: await this.imageExist(product.id),
      })),
    );
  }

  private async imageExist(productsId: number) {
    try {
      await fs.access(
        join(__dirname, '../../', `public/products/${productsId}.jpg`),
        fs.constants.F_OK,
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
