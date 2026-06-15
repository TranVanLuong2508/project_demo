import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EnvConfigService } from 'src/shared/services/env-config.service';
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, Shopify, DataType } from '@shopify/shopify-api';
import { OrderDetailResponseDto } from './dtos/order-detail-response.dto';
import { ShopifyEndpoint } from './enums/shopify-endpoint.enum';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  private readonly shopify: Shopify;
  private readonly restClient: InstanceType<Shopify['clients']['Rest']>;
  private readonly graphQlClient: InstanceType<Shopify['clients']['Graphql']>;

  constructor(private readonly envConfigService: EnvConfigService) {
    const { apiKey, apiSecret, accessToken, shopDomain, apiVersion } =
      this.envConfigService.shopifyConfig;

    this.shopify = shopifyApi({
      apiKey: apiKey,
      apiSecretKey: apiSecret,
      adminApiAccessToken: accessToken,
      hostName: shopDomain,
      isCustomStoreApp: true,
      isEmbeddedApp: false,
      apiVersion: apiVersion as any,
    });

    const session = this.shopify.session.customAppSession(shopDomain);
    this.restClient = new this.shopify.clients.Rest({ session });
    this.graphQlClient = new this.shopify.clients.Graphql({ session });
  }

  async testConnection() {
    try {
      const response = await this.restClient.get({ path: 'shop' });

      const shop = response.body.shop;
      return {
        success: true,
        message: 'Successfully connected to Shopify Store!',
        shopInfo: {
          name: shop.name,
          email: shop.email,
          domain: shop.domain,
          currency: shop.currency,
          country: shop.country_name,
        },
      };
    } catch (error: any) {
      const errorDetail = error.response?.body ?? error.message;
      console.error('Shopify API Error:', errorDetail);

      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to connect to Shopify. Please check your credentials.',
        error: errorDetail,
      });
    }
  }

  //======================= REST API =======================

  async getAllOrders(limit = 50) {
    try {
      const response = await this.restClient.get({
        path: ShopifyEndpoint.ORDERS,
        query: {
          status: OrderStatus.ANY,
          limit,
        },
      });

      const rawData = response.body.orders ?? [];
      const orders = OrderDetailResponseDto.fromShopifyList(rawData);

      return { success: true, count: orders.length, data: orders };
    } catch (error: any) {
      this.handleShopifyError(error, 'REST: Failed to fetch orders');
    }
  }

  async getAllOrderWithGraph(limit: number = 50) {
    try {
      const response = await this.graphQlClient.request(
        `
      query getOrders($limit: Int!) {
        orders(first: $limit, query: "status:any") {
          edges {
            node {
              id
              name
              createdAt
              updatedAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
      `,
        {
          variables: {
            limit,
          },
        },
      );

      const orders =
        response.data?.orders?.edges?.map(
          (edge: any) => edge.node,
        ) ?? [];

      return {
        success: true,
        count: orders.length,
        data: response,
      };
    } catch (error: any) {
      this.handleShopifyError(
        error,
        'GraphQL: Failed to fetch orders',
      );
    }
  }

  async getOrderById(orderId: string) {
    try {
      const response = await this.restClient.get({
        path: `${ShopifyEndpoint.ORDERS}/${orderId}`,
      });

      const rawData = response.body.order ?? null;
      const order = OrderDetailResponseDto.fromShopify(rawData);

      return { success: true, data: order };
    } catch (error: any) {
      this.handleShopifyError(error, 'REST: Failed to fetch order by ID');
    }
  }

  async fulfillOrder(
    orderId: string,
    trackingNumber: string,
    trackingCompany: string,
  ) {
    try {
      this.logger.log(`Fulfilling order ${orderId} via REST API...`);

      //Get Fulfillment Orders for the given orderId
      const foResponse = await this.restClient.get({
        path: `orders/${orderId}/fulfillment_orders`,
      });

      const fulfillmentOrders = foResponse.body.fulfillment_orders ?? [];

      if (fulfillmentOrders.length === 0) {
        throw new BadRequestException(
          `No fulfillment orders found for order ${orderId}`,
        );
      }
      // first fulfillment order that is open
      const fulfillmentOrder = fulfillmentOrders.find(
        (fo: any) => fo.status === 'open' || fo.status === 'in_progress',
      );

      if (!fulfillmentOrder) {
        throw new BadRequestException(
          `No open fulfillment orders found for order ${orderId}`,
        );
      }

      //Create fulfillment
      const fulfillResponse = await this.restClient.post({
        path: 'fulfillments',
        type: DataType.JSON,
        data: {
          fulfillment: {
            line_items_by_fulfillment_order: [
              {
                fulfillment_order_id: fulfillmentOrder.id,
              },
            ],
            tracking_info: {
              number: trackingNumber,
              company: trackingCompany,
            },
            notify_customer: true,
          },
        },
      });

      return {
        success: true,
        data: fulfillResponse.body.fulfillment,
      };
    } catch (error: any) {
      this.handleShopifyError(error, 'REST: Failed to fulfill order');
    }
  }

  async updateShipment(
    fulfillmentId: string,
    trackingNumber: string,
    trackingCompany: string,
  ) {
    try {
      const response = await this.restClient.post({
        path: `fulfillments/${fulfillmentId}/update_tracking`,
        type: DataType.JSON,
        data: {
          fulfillment: {
            tracking_info: {
              number: trackingNumber,
              company: trackingCompany,
            },
            notify_customer: true,
          },
        },
      });

      return {
        success: true,
        data: response.body.fulfillment,
      };
    } catch (error: any) {
      this.handleShopifyError(error, 'REST: Failed to update shipment');
    }
  }

  //======================= GRAPHQL =======================

  private handleShopifyError(error: any, defaultMessage: string): never {
    if (error instanceof BadRequestException) {
      throw error;
    }

    const errorDetail =
      error.response?.body ?? error.response?.errors ?? error.message;
    this.logger.error(`${defaultMessage}: ${JSON.stringify(errorDetail)}`);

    throw new InternalServerErrorException({
      success: false,
      message: defaultMessage,
      error: errorDetail,
    });
  }
}
