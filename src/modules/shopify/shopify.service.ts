import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EnvConfigService } from 'src/shared/services/env-config.service';
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, Shopify } from '@shopify/shopify-api';

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  private readonly shopify: Shopify;
  public readonly restClient: InstanceType<Shopify['clients']['Rest']>;
  public readonly graphQlClient: InstanceType<Shopify['clients']['Graphql']>;

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

      this.handleShopifyError(
        error,
        'Failed to connect to Shopify. Please check your credentials.',
      );
    }
  }



  public handleShopifyError(error: any, defaultMessage: string) {

    if (error instanceof HttpException) {
      throw error;
    }

    const errorDetail = error.response?.body ?? error.response?.errors ?? error.message;

    this.logger.error(`${defaultMessage}: ${JSON.stringify(errorDetail)}`)

    throw new InternalServerErrorException({
      success: false,
      message: defaultMessage,
      error: errorDetail,
    });
  }
}
