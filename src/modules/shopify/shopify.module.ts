import { Module } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { ShopifyController } from './shopify.controller';
import { ProductService } from './services/product.service';
import { CustomerService } from './services/customer.service';
import { OrderService } from './services/order.service';

@Module({
  controllers: [ShopifyController],
  providers: [ShopifyService, ProductService, CustomerService, OrderService],
})
export class ShopifyModule {}
