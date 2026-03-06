import { Module, Global } from '@nestjs/common';
import { DaprSecretsService } from './services/dapr-secrets.service';
import { DaprSecurityService } from './services/dapr-security.service';
import { DaprConfigService } from './services/dapr-config.service';

@Global()
@Module({
  providers: [DaprSecretsService, DaprSecurityService, DaprConfigService],
  exports: [DaprSecretsService, DaprSecurityService, DaprConfigService],
})
export class DaprModule {}
