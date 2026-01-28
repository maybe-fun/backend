import { Injectable } from '@nestjs/common';

import { DataSource } from 'typeorm';

@Injectable()
export class WebhooksService {
  constructor(private dataSource: DataSource) {}
}
