import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, Put } from '@nestjs/common';
import { ShopifyService } from './shopify.service';
import { Public } from 'src/decorators/customize';
import { FulfillOrderDto } from './dtos/fulfill-order.dto';
import { ProductService } from './services/product.service';
import { CustomerService } from './services/customer.service';
import { OrderService } from './services/order.service';
import { CreateProductDto } from './dtos/create-product.dto';

@Controller('shopify')
export class ShopifyController {
  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly productService: ProductService,
    private readonly customerService: CustomerService,
    private readonly orderService: OrderService,
  ) { }

  @Get('test-connection')
  @Public()
  async testConnection() {
    return this.shopifyService.testConnection();
  }

  // ---  ENDPOINTS ---

  @Get('rest/orders')
  @Public()
  async getOrders() {
    return this.orderService.getAllOrders();
  }

  @Get('rest/order/get-by-id')
  @Public()
  async getDetailOrderById(@Query('orderId') orderId: string) {
    return this.orderService.getOrderById(orderId);
  }

  @Post('rest/orders/:shopifyOrderId/fulfill')
  @Public()
  async fulfillOrder(
    @Param('shopifyOrderId') shopifyOrderId: string,
    @Body() dto: FulfillOrderDto,
  ) {
    return this.orderService.fulfillOrder(
      shopifyOrderId,
      dto.trackingNumber,
      dto.trackingCompany,
    );
  }

  @Get('graph/orders')
  @Public()
  async getAllOrderWithGraph(@Query('limit', ParseIntPipe) limit: number) {
    return this.orderService.getAllOrderWithGraph(limit);
  }

  @Get('graph/order/get-by-id')
  @Public()
  async getDetailOrderByIdWithGraph(@Query('orderId') orderId: string) {
    return this.orderService.getOrderByIdWithGraph(orderId);
  }

  // --- PRODUCT & INVENTORY ENDPOINTS ---

  @Get('products')
  @Public()
  async getProducts(@Query('limit') limit?: string) {
    return this.productService.getProducts(limit);
  }

  @Get('products/get-by-id')
  @Public()
  async getProductById(@Query('productId') productId: string) {
    return this.productService.getProductById(productId);
  }

  @Post('products')
  @Public()
  async createProduct(@Body() body: CreateProductDto) {
    return this.productService.createProduct(body);
  }


  @Put('products/:id')
  @Public()
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.productService.updateProduct(id, body);
  }

  @Get('inventory-levels')
  @Public()
  async getInventoryLevels(@Query('locationIds') locationIds?: string) {
    return this.productService.getInventoryLevels(locationIds);
  }

  @Get('location/list')
  @Public()
  async getLocationList() {
    return this.productService.getLocations();
  }

  @Post('inventory-levels/set')
  @Public()
  async setInventoryLevel(@Body() body: { inventoryItemId: string, locationId: string, available: number }) {
    return this.productService.setInventoryLevel(body.inventoryItemId, body.locationId, body.available);
  }

  // --- CUSTOMERS ---

  @Get('customers')
  @Public()
  async getCustomers(@Query('limit') limit?: string) {
    return this.customerService.getCustomers(limit ? parseInt(limit, 10) : 50);
  }

  @Get('customers/get-by-id')
  @Public()
  async getCustomerById(@Query('customerId') customerId: string) {
    return this.customerService.getCustomerById(customerId);
  }

  @Get('customers/get-by-id/orders')
  @Public()
  async getCustomerOrders(@Query('customerId') customerId: string) {
    return this.customerService.getCustomerOrders(customerId);
  }
}
