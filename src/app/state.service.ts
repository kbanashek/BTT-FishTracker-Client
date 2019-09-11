import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  // tslint:disable-next-line: variable-name
  private _selectedLayer: BehaviorSubject<any> = new BehaviorSubject(null);

  public set selectedLayer(value: any) {
    this._selectedLayer.next(value);
  }

  getSelectedLayer: Observable<any> = this._selectedLayer.asObservable();
}
