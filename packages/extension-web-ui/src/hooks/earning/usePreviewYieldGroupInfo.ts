// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldPoolInfo } from '@subwallet/extension-base/types';
import { BN_TEN, BN_ZERO } from '@subwallet/extension-web-ui/constants';
import { useGetChainSlugsByCurrentAccount, useSelector } from '@subwallet/extension-web-ui/hooks';
import { BalanceValueInfo, YieldGroupInfo } from '@subwallet/extension-web-ui/types';
import { isRelatedToAstar } from '@subwallet/extension-web-ui/utils';
import BigN from 'bignumber.js';
import { useMemo } from 'react';

function calculateTotalValueStaked (poolInfo: YieldPoolInfo, assetRegistry: Record<string, _ChainAsset>, priceMap: Record<string, number>) {
  const asset = assetRegistry[poolInfo.metadata.inputAsset];
  const tvl = poolInfo.statistic?.tvl;

  if (!asset || !asset.priceId || !tvl) {
    return new BigN(0);
  }

  const price = priceMap[asset.priceId] || 0;

  return new BigN(tvl)
    .div(BN_TEN.pow(asset.decimals || 0))
    .multipliedBy(price);
}

const usePreviewYieldGroupInfo = (poolInfoMap: Record<string, YieldPoolInfo>): YieldGroupInfo[] => {
  const assetRegistry = useSelector((state) => state.assetRegistry.assetRegistry);
  const multiChainAssetMap = useSelector((state) => state.assetRegistry.multiChainAssetMap);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const chainsByAccountType = useGetChainSlugsByCurrentAccount();
  const priceMap = useSelector((state) => state.price.priceMap);

  return useMemo(() => {
    const result: Record<string, YieldGroupInfo> = {};

    for (const pool of Object.values(poolInfoMap)) {
      const chain = pool.chain;

      if (chainsByAccountType.includes(chain)) {
        const group = pool.group;

        if (isRelatedToAstar(group)) {
          continue;
        }

        const exists = result[group];
        const chainInfo = chainInfoMap[chain];

        if (exists) {
          let apy: undefined | number;

          exists.poolListLength = exists.poolListLength + 1;

          if (pool.statistic?.totalApy) {
            apy = pool.statistic?.totalApy;
          }

          if (pool.statistic?.totalApr) {
            apy = calculateReward(pool.statistic?.totalApr).apy;
          }

          if (apy !== undefined) {
            exists.maxApy = Math.max(exists.maxApy || 0, apy);
          }

          if (pool.statistic?.earningThreshold?.join) {
            if (new BigN(exists.minJoin || 0).gt(pool.statistic?.earningThreshold?.join || '0')) {
              exists.description = pool.metadata.description;
            }
          }

          exists.isTestnet = exists.isTestnet || chainInfo.isTestnet;
          exists.poolSlugs.push(pool.slug);
          exists.totalValueStaked = exists.totalValueStaked.plus(calculateTotalValueStaked(pool, assetRegistry, priceMap));
        } else {
          const token = multiChainAssetMap[group] || assetRegistry[group];

          if (!token) {
            continue;
          }

          const freeBalance: BalanceValueInfo = {
            value: BN_ZERO,
            convertedValue: BN_ZERO,
            pastConvertedValue: BN_ZERO
          };

          let apy: undefined | number;

          if (pool.statistic?.totalApy) {
            apy = pool.statistic?.totalApy;
          }

          if (pool.statistic?.totalApr) {
            apy = calculateReward(pool.statistic?.totalApr).apy;
          }

          result[group] = {
            group: group,
            token: token.slug,
            maxApy: apy,
            symbol: token.symbol,
            balance: freeBalance,
            isTestnet: chainInfo.isTestnet,
            name: token.name,
            chain: chain,
            poolListLength: 1,
            poolSlugs: [pool.slug],
            description: pool.metadata.description,
            totalValueStaked: calculateTotalValueStaked(pool, assetRegistry, priceMap),
            minJoin: pool.statistic?.earningThreshold?.join
          };
        }
      }
    }

    return Object.values(result);
  }, [assetRegistry, chainInfoMap, chainsByAccountType, multiChainAssetMap, poolInfoMap, priceMap]);
};

export default usePreviewYieldGroupInfo;
