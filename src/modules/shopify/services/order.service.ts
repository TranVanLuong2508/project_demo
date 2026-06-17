import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ShopifyService } from '../shopify.service';
import { OrderDetailResponseDto } from '../dtos/order-detail-response.dto';
import { ShopifyEndpoint } from '../enums/shopify-endpoint.enum';
import { OrderStatus } from '../enums/order-status.enum';
import { DataType } from '@shopify/shopify-api';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly shopifyService: ShopifyService) {}

  //======================= REST API =======================

  async getAllOrders(limit = 50) {
    try {
      const response = await this.shopifyService.restClient.get({
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
      this.shopifyService.handleShopifyError(error, 'REST: Failed to fetch orders');
    }
  }

  async getOrderById(orderId: string) {
    try {
      const response = await this.shopifyService.restClient.get({
        path: `${ShopifyEndpoint.ORDERS}/${orderId}`,
      });

      const rawData = response.body.order ?? null;
      const order = OrderDetailResponseDto.fromShopify(rawData);

      return { success: true, data: order };
    } catch (error: any) {
      this.shopifyService.handleShopifyError(error, 'REST: Failed to fetch order by ID');
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
      const foResponse = await this.shopifyService.restClient.get({
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
      const fulfillResponse = await this.shopifyService.restClient.post({
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
      this.shopifyService.handleShopifyError(error, 'REST: Failed to fulfill order');
    }
  }

  async updateShipment(
    fulfillmentId: string,
    trackingNumber: string,
    trackingCompany: string,
  ) {
    try {
      const response = await this.shopifyService.restClient.post({
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
      this.shopifyService.handleShopifyError(error, 'REST: Failed to update shipment');
    }
  }

  //======================= GRAPHQL =======================

  async getAllOrderWithGraph(limit: number = 50) {
    try {
      const response = await this.shopifyService.graphQlClient.request(
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
        response.data?.orders?.edges?.map((edge: any) => edge.node) ?? [];

      return {
        success: true,
        count: orders.length,
        data: orders,
      };
    } catch (error: any) {
      this.shopifyService.handleShopifyError(error, 'GraphQL: Failed to fetch orders');
    }
  }

  async getOrderByIdWithGraph(orderId: string) {
    try {
      const graphqlId = orderId.includes('gid://')
        ? orderId
        : `gid://shopify/Order/${orderId}`;

      const response = await this.shopifyService.graphQlClient.request(
        `
      query getOrder($id: ID!) {
        order(id: $id) {
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
      `,
        {
          variables: {
            id: graphqlId,
          },
        },
      );

      const order = response.data?.order ?? null;

      return {
        success: true,
        data: order,
      };
    } catch (error: any) {
      this.shopifyService.handleShopifyError(error, 'GraphQL: Failed to fetch order by ID');
    }
  }

  async updateShipmentGraphQL(
    fulfillmentId: string,
    trackingNumber: string,
    trackingCompany: string,
  ) {
    try {
      const response = await this.shopifyService.graphQlClient.request(
        `
      mutation fulfillmentTrackingInfoUpdate(
        $fulfillmentId: ID!,
        $trackingInfoInput: FulfillmentTrackingInput!,
        $notifyCustomer: Boolean
      ) {
        fulfillmentTrackingInfoUpdate(
          fulfillmentId: $fulfillmentId
          trackingInfoInput: $trackingInfoInput
          notifyCustomer: $notifyCustomer
        ) {
          fulfillment {
            id
            status
            trackingInfo {
              number
              company
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }
      `,
        {
          variables: {
            fulfillmentId,
            trackingInfoInput: {
              number: trackingNumber,
              company: trackingCompany,
            },
            notifyCustomer: true,
          },
        },
      );

      const result =
        response.data.fulfillmentTrackingInfoUpdate;

      if (result.userErrors.length > 0) {
        throw new Error(
          JSON.stringify(result.userErrors),
        );
      }

      return {
        success: true,
        data: result.fulfillment,
      };
    } catch (error) {
      this.shopifyService.handleShopifyError(
        error,
        'GraphQL: Failed to update shipment',
      );
    }
  }
}
