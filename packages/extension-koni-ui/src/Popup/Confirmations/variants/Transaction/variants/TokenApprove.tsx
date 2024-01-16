// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TokenApproveData } from '@subwallet/extension-base/background/KoniTypes';
import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { CommonTransactionInfo, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { useGetChainAssetInfo } from '@subwallet/extension-koni-ui/hooks';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;

  const txParams = useMemo((): TokenApproveData => transaction.data as TokenApproveData, [transaction.data]);

  const inputAsset = useGetChainAssetInfo(txParams.inputTokenSlug);
  const spenderAsset = useGetChainAssetInfo(txParams.spenderTokenSlug);

  return (
    <div className={CN(className)}>
      <CommonTransactionInfo
        address={transaction.address}
        network={transaction.chain}
      />
      <MetaInfo hasBackgroundWrapper>
        {
          inputAsset && (
            <MetaInfo.Account
              address={_getContractAddressOfToken(inputAsset)}
              label={'Contract'}
            />
          )
        }

        {
          spenderAsset && (
            <MetaInfo.Account
              address={_getContractAddressOfToken(spenderAsset)}
              label={'Spender contract'}
            />
          )
        }
      </MetaInfo>
    </div>
  );
};

const TokenApproveConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default TokenApproveConfirmation;
