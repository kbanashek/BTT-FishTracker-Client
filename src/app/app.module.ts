import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AgmCoreModule } from '@agm/core';
import { FormsModule } from '@angular/forms';
import { SplashModalPageModule } from './splash-modal/splash-modal.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from './services/loader/index';
import { CacheService } from './services/loader/cache-service';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserAnimationsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyA_lt-ANaBp8xELvF6owyyIjTvZIzxBhXc',
    }),
    FormsModule,
    SplashModalPageModule,
    CoreModule,
  ],

  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    CacheService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
