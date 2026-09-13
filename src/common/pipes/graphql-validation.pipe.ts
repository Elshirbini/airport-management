import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';

@Injectable()
export class GraphQLValidationPipe extends ValidationPipe {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (value === undefined || value === null) {
      return value;
    }

    if (metadata.data === 'thumbnail' || metadata.data === 'images') {
      return value;
    }

    return super.transform(value, metadata);
  }
}
