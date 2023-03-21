// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import { BrowserConfirmationType, RequestSettingsType } from '@subwallet/extension-base/background/KoniTypes';
import RequestService from '@subwallet/extension-base/services/request-service';

const NOTIFICATION_URL = chrome.extension.getURL('notification.html');

const POPUP_WINDOW_OPTS: chrome.windows.CreateData = {
  focused: true,
  height: 600,
  type: 'popup',
  url: NOTIFICATION_URL,
  width: 390
};

const NORMAL_WINDOW_OPTS: chrome.windows.CreateData = {
  focused: true,
  type: 'normal',
  url: NOTIFICATION_URL,
  width: 390,
  height: 600
};

export default class PopupHandler {
  readonly #requestService: RequestService;
  #notification: BrowserConfirmationType = 'popup';
  #windows: number[] = [];

  constructor (requestService: RequestService) {
    this.#requestService = requestService;

    const updateNotification = (rs: RequestSettingsType) => {
      this.#notification = rs.browserConfirmationType;
    };

    requestService.settingService.getSettings(updateNotification);
    requestService.settingService.getSubject().subscribe({
      next: updateNotification
    });
  }

  public updateIconV2 (shouldClose?: boolean): void {
    const numRequests = this.#requestService.numRequests;
    const text = numRequests > 0 ? numRequests.toString() : '';

    withErrorLog(() => chrome.browserAction?.setBadgeText({ text }));

    if (shouldClose && text === '') {
      this.popupClose();
    }
  }

  public get popup () {
    return this.#windows;
  }

  public popupClose (): void {
    this.#windows.forEach((id: number) =>
      withErrorLog(() => chrome.windows.remove(id))
    );
    this.#windows = [];
  }

  public popupOpen (): void {
    if (this.#notification !== 'extension') {
      chrome.windows.getCurrent((win) => {
        const popupOptions = { ...(this.#notification === 'window' ? NORMAL_WINDOW_OPTS : POPUP_WINDOW_OPTS) };

        if (win) {
          popupOptions.left = (win.left || 0) + (win.width || 0) - (popupOptions.width || 0) - 20;
          popupOptions.top = (win.top || 0) + 80;
        }

        chrome.windows.create(popupOptions
          , (window): void => {
            if (window) {
              this.#windows.push(window.id || 0);
            }
          }
        );
      });
    }
  }
}
