import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SplashModalPage } from './splash-modal.page';

describe('SplashModalPage', () => {
  let component: SplashModalPage;
  let fixture: ComponentFixture<SplashModalPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SplashModalPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SplashModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
