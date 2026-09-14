import { InputType } from '@nestjs/graphql';

import { PaginationInput } from '../../../common/graphql/inputs/pagination.input';

@InputType()
export class AirportQueryInput extends PaginationInput {}
