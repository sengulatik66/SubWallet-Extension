// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { LedgerNetwork } from '@subwallet/extension-base/background/KoniTypes';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { Ledger } from '@subwallet/extension-koni-ui/connector/Ledger';
import { EVMLedger } from '@subwallet/extension-koni-ui/connector/Ledger/EVMLedger';
import { SubstrateLedger } from '@subwallet/extension-koni-ui/connector/Ledger/SubstrateLedger';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import useGetSupportedLedger from '@subwallet/extension-koni-ui/hooks/ledger/useGetSupportedLedger';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AccountOptions, LedgerAddress, LedgerSignature } from '@polkadot/hw-ledger/types';
import { assert } from '@polkadot/util';

import useTranslation from '../common/useTranslation';

interface StateBase {
  isLedgerCapable: boolean;
  isLedgerEnabled: boolean;
}

interface Result extends StateBase {
  error: string | null;
  isLoading: boolean;
  isLocked: boolean;
  ledger: Ledger | null;
  refresh: () => void;
  warning: string | null;
  getAddress: (accountIndex: number) => Promise<LedgerAddress>;
  signTransaction: Ledger['sign'];
}

const isLedgerCapable = !!(window as unknown as { USB?: unknown }).USB;

const baseState: StateBase = {
  isLedgerCapable,
  isLedgerEnabled: isLedgerCapable
  /* disable setting about ledger */
  // && uiSettings.ledgerConn !== 'none'
};

const getNetwork = (slug: string, ledgerChains: LedgerNetwork[]): LedgerNetwork | undefined => {
  return ledgerChains.find((network) => network.slug === slug);
};

const retrieveLedger = (slug: string, ledgerChains: LedgerNetwork[], chainInfoMap: Record<string, _ChainInfo>): Ledger => {
  const { isLedgerCapable } = baseState;

  assert(isLedgerCapable, 'Incompatible browser, only Chrome is supported');

  let def = getNetwork(slug, ledgerChains);

  if (!def) {
    const chain = chainInfoMap[slug];

    if (chain) {
      if (_isChainEvmCompatible(chain)) {
        def = {
          network: chain.name,
          chainId: chain.evmInfo?.evmChainId || 1,
          slug: chain.slug,
          isDevMode: true,
          isEthereum: true,
          displayName: chain.name,
          icon: 'ethereum',
          genesisHash: ''
        };
      }
    }
  }

  assert(def, 'There is no known Ledger app available for this chain');

  if (def.isEthereum) {
    return new EVMLedger('webusb', def.chainId, chainInfoMap);
  } else {
    return new SubstrateLedger('webusb', def.network);
  }
};

export function useLedger (slug?: string, active = true): Result {
  const { t } = useTranslation();

  const ledgerChains = useGetSupportedLedger();
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const timeOutRef = useRef<NodeJS.Timer>();

  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshLock, setRefreshLock] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ledger = useMemo(() => {
    setError(null);
    setIsLocked(false);
    setIsLoading(true);
    setWarning(null);
    setRefreshLock(false);

    // this trick allows to refresh the ledger on demand
    // when it is shown as locked and the user has actually
    // unlocked it, which we can't know.
    if (refreshLock || slug) {
      if (!slug || !active) {
        return null;
      }

      try {
        return retrieveLedger(slug, ledgerChains, chainInfoMap);
      } catch (error) {
        setError((error as Error).message);
      }
    }

    return null;
  }, [refreshLock, slug, active, ledgerChains, chainInfoMap]);

  useEffect(() => {
    if (!ledger || !slug || !active) {
      return;
    }

    clearTimeout(timeOutRef.current);

    setWarning(null);
    setError(null);

    timeOutRef.current = setTimeout(() => {
      ledger.getAddress(false, 0, 0)
        .then(() => {
          setIsLoading(false);
        })
        .catch((e: Error) => {
          setIsLoading(false);
          const { displayName } = getNetwork(slug, ledgerChains) || { displayName: 'unknown network' };

          const warningMessage = e.message.includes('Locked device (0x5515)')
            ? t<string>('Please unlock your Ledger')
            : null;

          const errorMessage = e.message.includes('App does not seem to be open')
            ? t<string>('Open "{{network}}" on Ledger to connect', { replace: { network: displayName.replaceAll(' network', '') } })
            : t('Fail to connect. Click to retry');

          setIsLocked(true);
          setWarning(warningMessage);
          setError(errorMessage);
          console.error(e);
        });
    }, 300);
  }, [slug, ledger, ledgerChains, t, active]);

  const getAddress = useCallback(async (accountIndex: number): Promise<LedgerAddress> => {
    if (ledger) {
      return ledger.getAddress(false, accountIndex, 0);
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error("Can't find ledger"));
      });
    }
  }, [ledger]);

  const signTransaction = useCallback(async (message: Uint8Array, accountOffset?: number, addressOffset?: number, accountOption?: Partial<AccountOptions>): Promise<LedgerSignature> => {
    if (ledger) {
      return new Promise((resolve, reject) => {
        setError(null);

        ledger.sign(message, accountOffset, addressOffset, accountOption)
          .then((result) => {
            resolve(result);
          })
          .catch((error: Error) => {
            console.log(error);
            setError(error.message);
            reject(error);
          });
      });
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error("Can't find ledger"));
      });
    }
  }, [ledger]);

  const refresh = useCallback(() => {
    setRefreshLock(true);
    console.log('refresh');
  }, []);

  return useMemo(() => ({
    ...baseState,
    error,
    isLoading,
    isLocked,
    ledger,
    refresh,
    warning,
    getAddress,
    signTransaction
  }),
  [error, isLoading, isLocked, ledger, refresh, warning, getAddress, signTransaction]
  );
}
