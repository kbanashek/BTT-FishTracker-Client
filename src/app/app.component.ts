import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StateService } from './state.service';

export const serviceURL =
  'http://ec2-184-73-138-203.compute-1.amazonaws.com:3000/tarpons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  @Output() selectedLayer: EventEmitter<any> = new EventEmitter();
  ionicNamedColor: string;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private http: HttpClient,
    private state: StateService,
  ) {
    this.initializeApp();
  }

  itemsList: any;

  toggleChange = selectedItem => {
    this.itemsList.forEach(x => (x.namedColor = 'secondary'));

    if (selectedItem) {
      selectedItem.namedColor = 'primary';
      this.setSelectedLayer(selectedItem);
    }
  };

  setSelectedLayer = (selectedItem: any): void => {
    this.state.selectedLayer = selectedItem;
  };

  initializeApp = () => {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      this.getTarpons().subscribe(
        results => {
          results.forEach(x => {
            x.checked = false;
            x.namedColor = 'secondary';
          });
          this.itemsList = results;
        },
        // TODO: error handling
      );
    });
  };

  log = item => {
    console.log(item);
  };

  getTarpons = (): Observable<any> => {
    return this.http.get<any>(serviceURL).pipe(map(x => x));
  };
}
