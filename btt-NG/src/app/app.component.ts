import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StateService } from './state.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home',
    },
    {
      title: 'List',
      url: '/list',
      icon: 'list',
    },
  ];
  itemsList: any;

  @Output() selectedLayer: EventEmitter<any> = new EventEmitter();

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private http: HttpClient,
    private state: StateService,
  ) {
    this.initializeApp();
  }

  private url = 'https://btt-api.herokuapp.com/tarpons?_limit=20';

  toggleChange = selectedItem => {
    if (selectedItem.checked === true) {
      this.itemsList.forEach(x => (x.checked = false));
      selectedItem.checked = true;
      if (selectedItem) {
        this.state.selectedLayer = selectedItem;
      }
    } else {
      selectedItem.checked = false;
    }
  };

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.getTarpons().subscribe(
        results => {
          results.forEach(x => {
            x.checked = false;
          });
          this.itemsList = results;
        },
        // TODO: error handling
      );
    });
  }

  log = item => {
    console.log(item);
  };

  getTarpons = (): Observable<any> => {
    return this.http.get<any>(this.url).pipe(map(x => x));
  };
}
