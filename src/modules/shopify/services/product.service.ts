import { Injectable, Logger } from '@nestjs/common';
import { ShopifyService } from '../shopify.service';
import { DataType } from '@shopify/shopify-api';
import { CreateProductDto } from '../dtos/create-product.dto';

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(private readonly shopifyService: ShopifyService) { }

    async getProducts(limit) {
        let LIMIT: number = limit ? parseInt(limit, 10) : 50
        try {
            const response = await this.shopifyService.restClient.get({
                path: 'products',
                query: { limit: LIMIT },
            });
            return { success: true, data: response.body.products };
        } catch (error: any) {
            this.shopifyService.handleShopifyError(error, 'REST: Failed to fetch products');
        }
    }

    async createProduct(productData: CreateProductDto) {
        try {
            const response = await this.shopifyService.restClient.post({
                path: 'products',
                type: DataType.JSON,
                data: {
                    product: productData,
                },
            });
            return { success: true, data: response.body.product };
        } catch (error: any) {
            this.shopifyService.handleShopifyError(error, 'REST: Failed to create product');
        }
    }

    async updateProduct(productId: string, updateData: any) {
        try {
            const response = await this.shopifyService.restClient.put({
                path: `products/${productId}`,
                type: DataType.JSON,
                data: {
                    product: {
                        id: productId,
                        ...updateData,
                    },
                },
            });
            return { success: true, data: response.body.product };
        } catch (error: any) {
            this.shopifyService.handleShopifyError(error, `REST: Failed to update product ${productId}`);
        }
    }

    async getProductById(productId: string) {
        try {
            const response = await this.shopifyService.restClient.get({
                path: `products/${productId}`,
            });
            return { success: true, data: response.body.product };
        } catch (error: any) {
            this.shopifyService.handleShopifyError(error, `REST: Failed to fetch product ${productId}`);
        }
    }

    async getInventoryLevels(locationIds?: string) {
        try {
            const query: any = {};
            if (locationIds) {
                query.location_ids = locationIds;
            }
            const response = await this.shopifyService.restClient.get({
                path: 'inventory_levels',
                query,
            });
            return { success: true, data: response.body.inventory_levels };
        } catch (error: any) {
            this.shopifyService.handleShopifyError(error, 'REST: Failed to fetch inventory levels');
        }
    }

    async setInventoryLevel(inventoryItemId: string, locationId: string, available: number) {
        try {
            const response = await this.shopifyService.restClient.post({
                path: 'inventory_levels/set',
                type: DataType.JSON,
                data: {
                    location_id: locationId,
                    inventory_item_id: inventoryItemId,
                    available,
                },
            });
            return { success: true, data: response.body.inventory_level };
        } catch (error: any) {
            this.shopifyService.handleShopifyError(error, 'REST: Failed to set inventory level');
        }
    }


    async getLocations() {
        try {
            const response = await this.shopifyService.restClient.get({
                path: 'locations',
            });

            return {
                success: true,
                data: response.body.locations,
            };
        } catch (error: any) {
            this.shopifyService.handleShopifyError(
                error,
                'REST: Failed to fetch locations',
            );
        }
    }
}