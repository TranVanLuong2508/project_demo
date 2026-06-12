import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { Public } from 'src/decorators/customize';
import { FulfillOrderDto } from './dtos/fulfill-order.dto';

@Controller('shopify')
export class ShopifyController {
  constructor(
    private readonly shopifyService: ShopifyService,
  ) { }

  @Get('test-connection')
  @Public()
  async testConnection() {
    return this.shopifyService.testConnection();
  }

  // --- REST API ENDPOINTS ---

  @Get('rest/orders')
  @Public()
  async getOrders() {
    return this.shopifyService.getAllOrders();
  }

  @Get('rest/order/get-by-id')
  @Public()
  async getDetailOrderById(@Query("orderId") orderId: string) {
    return this.shopifyService.getOrderById(orderId);
  }

  @Post('rest/orders/:shopifyOrderId/fulfill')
  @Public()
  async fulfillOrder(
    @Param('shopifyOrderId') shopifyOrderId: string,
    @Body() dto: FulfillOrderDto,
  ) {
    return this.shopifyService.fulfillOrder(shopifyOrderId, dto.trackingNumber, dto.trackingCompany);
  }
}
