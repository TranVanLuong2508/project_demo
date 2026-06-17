import { Injectable, Logger } from '@nestjs/common';
import { ShopifyService } from '../shopify.service';

@Injectable()
export class CustomerService {
    private readonly logger = new Logger(CustomerService.name);

    constructor(private readonly shopifyService: ShopifyService) { }

    async getCustomers(limit: number = 50) {
        try {
            const response = await this.shopifyService.restClient.get({
                path: 'customers',
                query: { limit },
            });
            const customers = response.body.customers.map((customer: any) => ({
                id: customer.id,
                firstName: customer.first_name,
                lastName: customer.last_name,
                fullName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
                email: customer.email,
                phone: customer.phone,
                state: customer.state,
                verifiedEmail: customer.verified_email,
                ordersCount: customer.orders_count,
                totalSpent: customer.total_spent,
                currency: customer.currency,
                createdAt: customer.created_at,
                updatedAt: customer.updated_at,
            }));
            return { success: true, data: customers };

        } catch (error: any) {
            this.shopifyService.handleShopifyError(
                error,
                'REST: Failed to fetch customers',
            );
        }
    }

    async getCustomerById(customerId: string) {
        try {
            const response = await this.shopifyService.restClient.get({
                path: `customers/${customerId}`,
            });
            return { success: true, data: response.body.customer };
        } catch (error: any) {
            this.shopifyService.handleShopifyError(error, `REST: Failed to fetch customer ${customerId}`);
        }
    }

    async getCustomerOrders(customerId: string) {
        try {
            const response = await this.shopifyService.restClient.get({
                path: `customers/${customerId}/orders`,
            });
            return { success: true, data: response.body.orders };
        } catch (error: any) {
            this.shopifyService.handleShopifyError(error, `REST: Failed to fetch orders for customer ${customerId}`);
        }
    }
}