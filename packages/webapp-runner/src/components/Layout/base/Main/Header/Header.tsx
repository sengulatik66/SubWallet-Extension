import MetaInfo from "@subwallet-webapp/components/MetaInfo"
import { NumberItem } from "@subwallet-webapp/components/MetaInfo/parts"
import { ThemeProps } from "@subwallet-webapp/types/index"
import { BalanceItem, Button, Icon, Typography } from "@subwallet/react-ui"
import CN from "classnames"
import { FadersHorizontal } from "phosphor-react"
import Balance from "./Balance"

export type Props = ThemeProps

const mock = [
  {
    address: "string",
    name: "string",
  },
  {
    address: "string",
    name: "string",
  },
  {
    address: "string",
    name: "string",
  },
  {
    address: "string",
    name: "string",
  },
]

function Component({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={CN(className)}>
      <div className="common-header">
        <Typography.Title className="page-name">Porfolio</Typography.Title>
        <div className="action-group">
          <Button
            icon={<Icon phosphorIcon={FadersHorizontal} size={"sm"} />}
            size={"xs"}
            type={"ghost"}
          />
          <MetaInfo.AccountGroup
            className="ava-group"
            accounts={mock}
            content={`${mock.length} networks`}
            // label={t(data.type === StakingType.POOLED ? "Pool" : "Validators")}
          />
          <MetaInfo.AccountGroup
            className="ava-group"
            accounts={mock}
            content={`${mock.length} networks`}
            // label={t(data.type === StakingType.POOLED ? "Pool" : "Validators")}
          />
        </div>
      </div>

      <Balance />
    </div>
  )
}

export default Component
