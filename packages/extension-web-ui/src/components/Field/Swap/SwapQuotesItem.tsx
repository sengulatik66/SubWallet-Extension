// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetDecimals, _getAssetSymbol } from '@subwallet/extension-base/services/chain-service/utils';
import { SwapQuote } from '@subwallet/extension-base/types/swap';
import { BN_TEN } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { CheckCircle, CircleWavyCheck } from 'phosphor-react';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  isRecommend?: boolean,
  quote: SwapQuote;
  selected?: boolean,
  onSelect?: (quote: SwapQuote) => void,
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, isRecommend, onSelect, quote, selected } = props;
  const assetRegistryMap = useSelector((state) => state.assetRegistry.assetRegistry);
  const _onSelect = useCallback(() => {
    onSelect?.(quote);
  }, [onSelect, quote]);

  const fromAssetInfo = useMemo(() => {
    return assetRegistryMap[quote.pair.from] || undefined;
  }, [assetRegistryMap, quote.pair.from]);

  const toAssetInfo = useMemo(() => {
    return assetRegistryMap[quote.pair.to] || undefined;
  }, [assetRegistryMap, quote.pair.to]);

  const destinationSwapValue = useMemo(() => {
    const decimals = _getAssetDecimals(fromAssetInfo);

    return new BigN(quote.fromAmount)
      .div(BN_TEN.pow(decimals))
      .multipliedBy(quote.rate);
  }, [quote, fromAssetInfo]);

  return (
    <>
      <div
        className={CN(className, 'swap-quotes-container')}
        onClick={_onSelect}
      >
        <div className={'__left-part'}>
          <div className={'__line-1'}>
            <span className={'__provider-name'}>{quote.provider.name}</span>
            {isRecommend && (
              <Icon
                className='wavy-icon'
                customSize={'16px'}
                phosphorIcon={CircleWavyCheck}
                size='md'
                weight='fill'
              />
            )}
          </div>
          <div className={'__line-2'}>
            <span className={'__est-receive-label'}>Est.receive</span>
            <Number
              className={'__est-receive-value'}
              decimal={0}
              suffix={_getAssetSymbol(toAssetInfo)}
              value={destinationSwapValue}
            />
          </div>
        </div>
        {selected && (<div className={'__right-part'}>
          <Icon
            className='check-icon'
            phosphorIcon={CheckCircle}
            size='md'
            weight='fill'
          />
        </div>)}
      </div>
    </>
  );
};

const ChooseFeeItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: token.colorBgSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    '.wavy-icon': {
      color: token.colorPrimary,
      paddingLeft: 4
    },
    '.__provider-name': {
      fontSize: 14,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeight,
      color: token.colorTextTertiary
    },
    '.__item-label': {
      color: token.colorTextTertiary
    },
    '.__item-value': {
      color: token.colorWhite
    },
    '.check-icon': {
      color: token.colorSuccess
    },
    '.__est-receive-label': {
      color: token.colorTextTertiary,
      fontSize: 12,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeightSM,
      paddingRight: 4
    },
    '.__line-2': {
      display: 'flex',
      alignItems: 'baseline'
    },
    '.__est-receive-value': {
      color: token.colorWhite,
      fontSize: token.fontSizeSM,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeightSM,
      '.ant-number-integer': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      },

      '.ant-number-decimal, .ant-number-suffix': {
        color: `${token.colorWhite} !important`,
        fontSize: `${token.fontSizeSM}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeightSM
      }
    }
  };
});

export default ChooseFeeItem;
