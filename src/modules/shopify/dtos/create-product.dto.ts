import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProductDto {

    @IsString()
    @IsNotEmpty()
    title: string;
    @IsOptional()
    @IsString()
    descriptionHtml?: string;

    @IsOptional()
    @IsString()
    vendor?: string;

    @IsOptional()
    @IsString()
    productType?: string;

    @IsOptional()
    @IsString()
    handle?: string;

    @IsOptional()
    @IsArray()
    tags?: string[];

    @IsOptional()
    @IsEnum(['active', 'draft', 'archived'])
    status?: string
}