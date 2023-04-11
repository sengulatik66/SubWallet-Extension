// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { persistor, store, StoreName } from "@subwallet-webapp/stores";
import {
  subscribeAccountsData,
  subscribeAssetRegistry,
  subscribeAssetSettings,
  subscribeAuthorizeRequests,
  subscribeAuthUrls,
  subscribeBalance,
  subscribeChainInfoMap,
  subscribeChainStakingMetadata,
  subscribeChainStateMap,
  subscribeConfirmationRequests,
  subscribeCrowdloan,
  subscribeKeyringState,
  subscribeMetadataRequests,
  subscribeMultiChainAssetMap,
  subscribeNftCollections,
  subscribeNftItems,
  subscribePrice,
  subscribeSigningRequests,
  subscribeStaking,
  subscribeStakingNominatorMetadata,
  subscribeStakingReward,
  subscribeTransactionRequests,
  subscribeTxHistory,
  subscribeUiSettings,
  subscribeXcmRefMap,
} from "@subwallet-webapp/stores/utils";
import Bowser from "bowser";
import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

interface DataContextProviderProps {
  children?: React.ReactElement;
}

export type DataMap = Record<StoreName, boolean>;

export interface DataHandler {
  name: string;
  unsub?: () => void;
  isSubscription?: boolean;
  start: () => void;
  isStarted?: boolean;
  isStartImmediately?: boolean;
  promise?: Promise<any>;
  relatedStores: StoreName[];
}

export interface DataContextType {
  handlerMap: Record<string, DataHandler>;
  storeDependencies: Partial<Record<StoreName, string[]>>;
  readyStoreMap: DataMap;

  addHandler: (item: DataHandler) => () => void;
  removeHandler: (name: string) => void;
  awaitRequestsCache: Record<string, Promise<boolean>>;
  awaitStores: (storeNames: StoreName[], renew?: boolean) => Promise<boolean>;
}

const _DataContext: DataContextType = {
  handlerMap: {}, // Map to store data handlers
  storeDependencies: {}, // Map to store dependencies of each store
  awaitRequestsCache: {}, // Cache request promise to avoid rerender
  readyStoreMap: Object.keys(store.getState()).reduce((map, key) => {
    map[key as StoreName] = false; // Initialize each store to be not ready

    return map;
  }, {} as DataMap), // Convert the result to DataMap type
  addHandler: function (item: DataHandler) {
    // console.log('====item', item);
    // Add a new data handler
    const { name } = item;

    item.isSubscription = !!item.unsub; // Check if the handler has an unsubscribe function

    // If the handler doesn't exist in the map yet
    if (!this.handlerMap[name]) {
      this.handlerMap[name] = item; // Add the handler to the map
      item.relatedStores.forEach((storeName) => {
        // If the store doesn't have any dependencies yet
        if (!this.storeDependencies[storeName]) {
          this.storeDependencies[storeName] = []; // Initialize an empty array for the store's dependencies
        }

        // Add the handler to the store's dependencies
        this.storeDependencies[storeName]?.push(name);
      });

      // If the handler is set to start immediately
      if (item.isStartImmediately) {
        console.log('====handler item.isStartImmediately', item.isStartImmediately);
        setTimeout(() => {
          console.log('====handler item.isStartImmediately Action');
          item.start(); // Start the handler
          item.isStarted = true; // Mark the handler as started
        }, 3000);
      }
    }

    // Return a function to remove the handler
    return () => {
      this.removeHandler(name);
    };
  },
  removeHandler: function (name: string) {
    // Remove a data handler
    const item = this.handlerMap[name];

    // If the handler doesn't exist in the map
    if (!item) {
      return; // Return without doing anything
    }

    // If the handler has an unsubscribe function, call it
    item.unsub && item.unsub();
    // Remove the handler from all the store's dependencies
    Object.values(this.storeDependencies).forEach((handlers) => {
      const removeIndex = handlers.indexOf(name);

      if (removeIndex >= 0) {
        handlers.splice(removeIndex, 1);
      }
    });

    // If the handler exists in the map, delete it
    if (this.handlerMap[name]) {
      delete this.handlerMap[name];
    }
  },
  awaitStores: function (storeNames: StoreName[], renew = false) {
    const key = storeNames.join("-");

    // Check await cache to avoid rerun many times
    if (!Object.hasOwnProperty.call(this.awaitRequestsCache, key) || renew) {
      const handlers = storeNames.reduce((acc, sName) => {
        (this.storeDependencies[sName] || []).forEach((handlerName) => {
          if (!acc.includes(handlerName)) {
            acc.push(handlerName);
          }
        });

        return acc;
      }, [] as string[]);

      // Create an array of promises from the handlers
      console.log('====handlers', handlers);
      const promiseList = handlers.map((siName) => {
        const handler = this.handlerMap[siName];
        // console.log('====handler', handler);

        // Start the handler if it's not started or it's not a subscription and we want to renew
        if (!handler.isStarted || (!handler.isSubscription && renew)) {
          handler.start();
          handler.isStarted = true;
        }

        return handler.promise;
      });

      // Mark the store names as ready
      storeNames.forEach((n) => {
        this.readyStoreMap[n] = true;
      });

      setTimeout(() => {
        this.awaitRequestsCache[key] = Promise.all(promiseList).then((data) => {
          console.log('====handler data', data);
          return true;
        }).catch(error => {
          console.log('====handle rerror', error);
          return true;
        });
      }, 2000)
    }

    // Wait for all handlers to finish
    // console.log('this.awaitRequestsCache[key]', {a: this.awaitRequestsCache[key]});
    return this.awaitRequestsCache[key];
  },
};

export function initBasicData() {
  console.log('initBasicData', initBasicData);
  // Init Application with some default data if not existed
  const VARIANTS = ["beam", "marble", "pixel", "sunset", "bauhaus", "ring"];

  function getRandomVariant(): string {
    const random = Math.floor(Math.random() * 6);

    return VARIANTS[random];
  }

  const browser = Bowser.getParser(window.navigator.userAgent);

  if (
    !window.localStorage.getItem("randomVariant") ||
    !window.localStorage.getItem("randomNameForLogo")
  ) {
    const randomVariant = getRandomVariant();

    window.localStorage.setItem("randomVariant", randomVariant);
    window.localStorage.setItem("randomNameForLogo", `${Date.now()}`);
  }

  if (
    !!browser.getBrowser() &&
    !!browser.getBrowser().name &&
    !!browser.getOS().name
  ) {
    window.localStorage.setItem(
      "browserInfo",
      browser.getBrowser().name as string
    );
    window.localStorage.setItem("osInfo", browser.getOS().name as string);
  }

  return true;
}

export const DataContext = React.createContext(_DataContext);

export const DataContextProvider = ({ children }: DataContextProviderProps) => {
  // Init basic data
  initBasicData();

  // Init subscription
  // Common
  _DataContext.addHandler({
    ...subscribeAccountsData,
    name: "subscribeAccountsData",
    relatedStores: ["accountState"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeKeyringState,
    name: "subscribeCurrentAccount",
    relatedStores: ["accountState"],
    isStartImmediately: true,
  });

  _DataContext.addHandler({
    ...subscribeChainStateMap,
    name: "subscribeChainStateMap",
    relatedStores: ["chainStore"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeChainInfoMap,
    name: "subscribeChainInfoMap",
    relatedStores: ["chainStore"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeAssetRegistry,
    name: "subscribeAssetRegistry",
    relatedStores: ["assetRegistry"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeMultiChainAssetMap,
    name: "subscribeMultiChainAssetMap",
    relatedStores: ["assetRegistry"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeAssetSettings,
    name: "subscribeAssetSettings",
    relatedStores: ["assetRegistry"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeXcmRefMap,
    name: "subscribeXcmRefMap",
    relatedStores: ["assetRegistry"],
    isStartImmediately: true,
  });

  // Settings
  _DataContext.addHandler({
    ...subscribeUiSettings,
    name: "subscribeUiSettings",
    relatedStores: ["settings"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeAuthUrls,
    name: "subscribeAuthUrls",
    relatedStores: ["settings"],
    isStartImmediately: true,
  });

  // Confirmations
  _DataContext.addHandler({
    ...subscribeAuthorizeRequests,
    name: "subscribeAuthorizeRequests",
    relatedStores: ["requestState"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeMetadataRequests,
    name: "subscribeMetadataRequests",
    relatedStores: ["requestState"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeSigningRequests,
    name: "subscribeSigningRequests",
    relatedStores: ["requestState"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeConfirmationRequests,
    name: "subscribeConfirmationRequests",
    relatedStores: ["requestState"],
    isStartImmediately: true,
  });
  _DataContext.addHandler({
    ...subscribeTransactionRequests,
    name: "subscribeTransactionRequests",
    relatedStores: ["requestState"],
    isStartImmediately: true,
  });

  // Features
  _DataContext.addHandler({
    ...subscribePrice,
    name: "subscribePrice",
    relatedStores: ["price"],
  });
  _DataContext.addHandler({
    ...subscribeBalance,
    name: "subscribeBalance",
    relatedStores: ["balance"],
  });
  _DataContext.addHandler({
    ...subscribeCrowdloan,
    name: "subscribeCrowdloan",
    relatedStores: ["crowdloan"],
  });
  _DataContext.addHandler({
    ...subscribeNftItems,
    name: "subscribeNftItems",
    relatedStores: ["nft"],
  });
  _DataContext.addHandler({
    ...subscribeNftCollections,
    name: "subscribeNftCollections",
    relatedStores: ["nft"],
  });
  _DataContext.addHandler({
    ...subscribeStaking,
    name: "subscribeStaking",
    relatedStores: ["staking"],
  });
  _DataContext.addHandler({
    ...subscribeStakingReward,
    name: "subscribeStakingReward",
    relatedStores: ["staking"],
  });
  _DataContext.addHandler({
    ...subscribeChainStakingMetadata,
    name: "subscribeChainStakingMetadata",
    relatedStores: ["staking"],
  });
  _DataContext.addHandler({
    ...subscribeStakingNominatorMetadata,
    name: "subscribeStakingNominatorMetadata",
    relatedStores: ["staking"],
  });
  _DataContext.addHandler({
    ...subscribeTxHistory,
    name: "subscribeTxHistory",
    relatedStores: ["transactionHistory"],
  });

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <DataContext.Provider value={_DataContext}>
          {children}
        </DataContext.Provider>
      </PersistGate>
    </Provider>
  );
};
