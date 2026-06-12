import { IsNotEmpty, IsString } from 'class-validator';

export class FulfillOrderDto {
  @IsString()
  @IsNotEmpty()
  trackingNumber: string;

  @IsString()
  @IsNotEmpty()
  trackingCompany: string;
}
