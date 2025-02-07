// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getSubstrateGenesisHash, _isChainEvmCompatible, _isPureEvmChain } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceItem } from '@subwallet/extension-base/types';
import { categoryAddresses, filterAssetsByChainAndType } from '@subwallet/extension-base/utils';
import keyring from '@subwallet/ui-keyring';

import { subscribeEVMBalance } from './evm';
import { subscribeSubstrateBalance } from './substrate';

/**
 * @function getAccountJsonByAddress
 * @desc Get account info by address
 * <p>
 *   Note: Use on the background only
 * </p>
 * @param {string} address - Address
 * @returns {AccountJson|null}  - Account info or null if not found
 */
export const getAccountJsonByAddress = (address: string): AccountJson | null => {
  try {
    const pair = keyring.getPair(address);

    if (pair) {
      return {
        address: pair.address,
        type: pair.type,
        ...pair.meta
      };
    } else {
      return null;
    }
  } catch (e) {
    console.warn(e);

    return null;
  }
};

/** Filter addresses to subscribe by chain info */
const filterAddress = (addresses: string[], chainInfo: _ChainInfo): [string[], string[]] => {
  const isEvmChain = _isChainEvmCompatible(chainInfo);
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  if (isEvmChain) {
    return [evmAddresses, substrateAddresses];
  } else {
    const fetchList: string[] = [];
    const unfetchList: string[] = [];

    substrateAddresses.forEach((address) => {
      const account = getAccountJsonByAddress(address);

      if (account) {
        if (account.isHardware) {
          const availGen = account.availableGenesisHashes || [];
          const gen = _getSubstrateGenesisHash(chainInfo);

          if (availGen.includes(gen)) {
            fetchList.push(address);
          } else {
            unfetchList.push(address);
          }
        } else {
          fetchList.push(address);
        }
      } else {
        fetchList.push(address);
      }
    });

    return [fetchList, [...unfetchList, ...evmAddresses]];
  }
};

// interface SubscribeBlanceOptions {
//   addresses: string[];
//   chains: string[];
//   tokens: string[];
//   chainInfoMap: Record<string, _ChainInfo>;
//   substrateApiMap: Record<string, _SubstrateApi>;
//   evmApiMap: Record<string, _EvmApi>;
//   callback: (rs: BalanceItem[]) => void;
// }

// main subscription, use for multiple chains, multiple addresses and multiple tokens
export function subscribeBalance (addresses: string[], chains: string[], tokens: string[], _chainAssetMap: Record<string, _ChainAsset>, _chainInfoMap: Record<string, _ChainInfo>, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, callback: (rs: BalanceItem[]) => void) {
  // Filter chain and token
  const chainAssetMap: Record<string, _ChainAsset> = Object.fromEntries(Object.entries(_chainAssetMap).filter(([token]) => tokens.includes(token)));
  const chainInfoMap: Record<string, _ChainInfo> = Object.fromEntries(Object.entries(_chainInfoMap).filter(([chain]) => chains.includes(chain)));

  // Looping over each chain
  const unsubList = Object.values(chainInfoMap).map(async (chainInfo) => {
    const chainSlug = chainInfo.slug;
    const [useAddresses, notSupportAddresses] = filterAddress(addresses, chainInfo);

    if (notSupportAddresses.length) {
      const tokens = filterAssetsByChainAndType(chainAssetMap, chainSlug, [_AssetType.NATIVE, _AssetType.ERC20, _AssetType.PSP22, _AssetType.LOCAL]);

      const now = new Date().getTime();

      Object.values(tokens).forEach((token) => {
        const items: BalanceItem[] = notSupportAddresses.map((address): BalanceItem => ({
          address,
          tokenSlug: token.slug,
          free: '0',
          locked: '0',
          state: APIItemState.NOT_SUPPORT,
          timestamp: now
        }));

        callback(items);
      });
    }

    const evmApi = evmApiMap[chainSlug];

    if (_isPureEvmChain(chainInfo)) {
      return subscribeEVMBalance({
        addresses: useAddresses,
        assetMap: chainAssetMap,
        callback,
        chainInfo,
        evmApi
      });
    }

    // if (!useAddresses || useAddresses.length === 0 || _PURE_EVM_CHAINS.indexOf(chainSlug) > -1) {
    //   const fungibleTokensByChain = state.chainService.getFungibleTokensByChain(chainSlug, true);
    //   const now = new Date().getTime();
    //
    //   Object.values(fungibleTokensByChain).map((token) => {
    //     return {
    //       tokenSlug: token.slug,
    //       free: '0',
    //       locked: '0',
    //       state: APIItemState.READY,
    //       timestamp: now
    //     } as BalanceItem;
    //   }).forEach(callback);
    //
    //   return undefined;
    // }

    const substrateApi = await substrateApiMap[chainSlug].isReady;

    return subscribeSubstrateBalance(useAddresses, chainInfo, chainAssetMap, substrateApi, evmApi, callback);
  });

  return () => {
    unsubList.forEach((subProm) => {
      subProm.then((unsub) => {
        unsub && unsub();
      }).catch(console.error);
    });
  };
}
