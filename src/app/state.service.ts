import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject, timer } from 'rxjs';
import { map, takeUntil, repeatWhen } from 'rxjs/operators';

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

export class RepeatingServiceCall<T> {
  readonly observable$: Observable<T>;
  private readonly _stop = new Subject<void>();
  private readonly _start = new Subject<void>();

  constructor(delay: number) {
    this.observable$ = timer(0, delay).pipe(
      map(() => <T>{}),
      takeUntil(this._stop),
      repeatWhen(() => this._start),
    );
  }

  start(): void {
    this._start.next();
  }

  stop(): void {
    this._stop.next();
  }
}
