// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { detectTranslate } from '@subwallet/extension-base/utils';
import { CLAIM_DAPP_STAKING_REWARDS, CLAIM_DAPP_STAKING_REWARDS_MODAL, DEFAULT_CLAIM_DAPP_STAKING_REWARDS_PARAMS } from '@subwallet/extension-koni-ui/constants';
import { ClainDappStakingRewardsParams, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, Warning, XCircle } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps
const modalId = CLAIM_DAPP_STAKING_REWARDS_MODAL;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { inactiveModal } = useContext(ModalContext);
  const [{ isShowed }, setIsShowNotificationModal] = useLocalStorage<ClainDappStakingRewardsParams>(CLAIM_DAPP_STAKING_REWARDS, DEFAULT_CLAIM_DAPP_STAKING_REWARDS_PARAMS);

  const changeValueByModeModal = useCallback(() => {
    if (isShowed) {
      setIsShowNotificationModal({ isShowed: true, isReminded: true });

      return;
    }

    setIsShowNotificationModal({ isShowed: true, isReminded: false });
  }, [isShowed, setIsShowNotificationModal]);

  const onCloseModal = useCallback(() => {
    inactiveModal(modalId);
    changeValueByModeModal();
  }, [changeValueByModeModal, inactiveModal]);

  const onOpenPortal = useCallback(() => {
    open('https://portal.astar.network/');
    inactiveModal(modalId);
    changeValueByModeModal();
  }, [changeValueByModeModal, inactiveModal]);

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={false}
        footer={
          <div className={'modal_btn'}>
            <Button
              block={true}
              className={'__left-btn'}
              icon={
                <Icon
                  customSize='28px'
                  phosphorIcon={XCircle}
                  weight={'fill'}
                />
              }
              onClick={onCloseModal}

              schema={'secondary'}
            >
                Dismiss
            </Button>
            <Button
              block={true}
              className={'__right-btn'}
              icon={
                <Icon
                  customSize='28px'
                  phosphorIcon={CheckCircle}
                  weight={'fill'}
                />
              }
              onClick={onOpenPortal}
            >
              Claim now
            </Button>
          </div>
        }
        id={modalId}
        title={'Claim ASTR staking rewards'}
      >
        <div className={'page-icon-astar-modal'}>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: Warning
            }}
          />
        </div>
        <div className='modal_content'>
          <Trans
            components={{
              highlight: (
                <a
                  className='link'
                  href='https://docs.astar.network/docs/learn/dapp-staking/dapp-staking-faq/#q-what-about-unclaimed-rewards'
                  rel='noopener noreferrer'
                  target='_blank'
                />
              )
            }}
            i18nKey={detectTranslate('<highlight>Astar dApp staking V3</highlight> is launching in early February. Make sure to claim any ASTR rewards before the launch or they will be lost.')}
          />
        </div>
      </SwModal>
    </>
  );
};

const ClaimDappStakingRewardsModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.modal_content': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightHeading6,
      textAlign: 'center',
      color: token.colorTextDescription,
      paddingLeft: token.padding,
      paddingRight: token.padding
    },
    '.modal_btn': {
      display: 'flex',
      justifyContent: 'row',
      gap: token.sizeSM
    },
    '.page-icon-astar-modal': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.margin,
      marginBottom: token.marginMD,
      '--page-icon-color': token.colorWarning
    },
    '.ant-sw-header-center-part': {
      width: 'auto'
    }
  };
});

export default ClaimDappStakingRewardsModal;
