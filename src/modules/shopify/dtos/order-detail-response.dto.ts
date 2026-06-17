export class OrderDetailResponseDto {
    id: string;
    orderNumber: number;
    name: string;
    confirmationNumber: string;
    createdAt: string;
    updatedAt: string;

    financialStatus: string;
    fulfillmentStatus: string | null;

    totalPrice: string;
    subtotalPrice: string;
    totalTax: string;
    totalShippingPrice: string;
    currency: string;

    customer: {
        id: string;
        email: string;
    } | null;

    shippingAddress: {
        firstName: string;
        lastName: string;
        address1: string;
        city: string;
        province: string;
        country: string;
        zip: string;
        phone: string;
    } | null;

    lineItems: {
        id: string;
        title: string;
        variantTitle: string;
        quantity: number;
        price: string;
        sku: string;
        fulfillmentStatus: string | null;
        requiresShipping: boolean;
    }[];

    fulfillments: {
        id: string;
        status: string;
        trackingCompany: string;
        trackingNumber: string;
        trackingUrls: string[];
        createdAt: string;
        updatedAt: string;
    }[];

    static fromShopify(raw: any): OrderDetailResponseDto {
        const dto = new OrderDetailResponseDto();

        dto.id = String(raw.id);
        dto.orderNumber = raw.order_number;
        dto.name = raw.name;
        dto.confirmationNumber = raw.confirmation_number;
        dto.createdAt = raw.created_at;
        dto.updatedAt = raw.updated_at;

        dto.financialStatus = raw.financial_status;
        dto.fulfillmentStatus = raw.fulfillment_status ?? null;

        dto.totalPrice = raw.total_price;
        dto.subtotalPrice = raw.subtotal_price;
        dto.totalTax = raw.total_tax;
        dto.totalShippingPrice = raw.total_shipping_price_set?.shop_money?.amount ?? '0.00';
        dto.currency = raw.currency;

        dto.customer = raw.customer ? {
            id: String(raw.customer.id),
            email: raw.customer.email,
        } : null;

        dto.shippingAddress = raw.shipping_address ? {
            firstName: raw.shipping_address.first_name,
            lastName: raw.shipping_address.last_name,
            address1: raw.shipping_address.address1,
            city: raw.shipping_address.city,
            province: raw.shipping_address.province,
            country: raw.shipping_address.country,
            zip: raw.shipping_address.zip,
            phone: raw.shipping_address.phone,
        } : null;

        dto.lineItems = raw.line_items?.map((item: any) => ({
            id: String(item.id),
            title: item.title,
            variantTitle: item.variant_title,
            quantity: item.quantity,
            price: item.price,
            sku: item.sku,
            fulfillmentStatus: item.fulfillment_status,
            requiresShipping: item.requires_shipping,
        })) || [];

        dto.fulfillments = raw.fulfillments?.map((fulfillment: any) => ({
            id: String(fulfillment.id),
            status: fulfillment.status,
            trackingCompany: fulfillment.tracking_company,
            trackingNumber: fulfillment.tracking_number,
            trackingUrls: fulfillment.tracking_urls,
            createdAt: fulfillment.created_at,
            updatedAt: fulfillment.updated_at,
        })) || [];

        return dto;
    }

    static fromShopifyList(raws: any[]): OrderDetailResponseDto[] {
        return raws.map((order) => OrderDetailResponseDto.fromShopify(order));
    }
}