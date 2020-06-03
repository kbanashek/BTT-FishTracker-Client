import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoaderService } from './loader-service';
import { LoaderCacheInterceptor } from './loader-interceptor';

@NgModule({
  providers: [
    LoaderService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderCacheInterceptor,
      multi: true,
    },
  ],
})
export class CoreModule {}

export * from './loader-service';
