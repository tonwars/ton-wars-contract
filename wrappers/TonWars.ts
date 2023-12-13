import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    ExternalAddress,
    Sender,
    SendMode
} from '@ton/core';
import { OP } from './ops';

export type TonWarsConfig = {
    owner: Address
};

export function tonWarsConfigToCell(config: TonWarsConfig): Cell {
    /*
        storage$_ owner:MsgAddress proposed_owner:MsgAddress
              champ:MsgAddress champ_bet_amount:Coins champ_win_time:uint64 // ~993 bits + 1 cell
              ^[bonus_paytime:uint64 bonus_percent:uint14
              first_affiliate_percent:uint14 second_affiliate_percent:uint14
              gas_prices:Cell] // ~554 bits
              = Storage;
    */
    return beginCell()
          .storeAddress(config.owner)
          .storeAddress(null)
          .storeAddress(config.owner)
          .storeCoins(0)
          .storeUint(0, 64)
          .storeRef(beginCell()
                   .storeUint(259200n, 64)
                   .storeUint(500, 14)
                   .storeUint(5000, 14)
                   .storeUint(5000, 14)
                   .storeUint(0n, 256)
                   .endCell())
          .endCell();
}

export class TonWars implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new TonWars(address);
    }

    static createFromConfig(config: TonWarsConfig, code: Cell, workchain = 0) {
        const data = tonWarsConfigToCell(config);
        const init = { code, data };
        return new TonWars(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await this.sendDepositBonus(provider, via, value, {});
    }

    async sendPlay(provider: ContractProvider, via: Sender, value: bigint,
        opts: {
            firstAffiliate?: Address | null,
            secondAffiliate?: Address | null
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                 .storeUint(OP.Play, 32)
                 .storeUint(0, 64)
                 .storeAddress(opts.firstAffiliate)
                 .storeAddress(opts.secondAffiliate)
                 .endCell(),
        });
    }

    async sendTransferOwnership(provider: ContractProvider, via: Sender, value: bigint,
        opts: {
            proposedOwner: Address
        }
    ) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(OP.TransferOwnership, 32)
                .storeUint(0, 64)
                .storeAddress(opts.proposedOwner)
            .endCell(),
        });
    }

    async sendAcceptOwnership(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(OP.AcceptOwnership, 32)
                .storeUint(0, 64)
            .endCell(),
        });
    }

    async sendDepositBonus(provider: ContractProvider, via: Sender, value: bigint, opts: { message?: string }) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                 .storeUint(OP.DepositBonus, 32)
                 .storeStringTail(opts.message ?? "")
                 .endCell(),
        });
    }

    async sendSetBonusPaytime(provider: ContractProvider, via: Sender, value: bigint,
        opts: {
            bonusPaytime: bigint
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                 .storeUint(OP.SetBonusPaytime, 32)
                 .storeUint(0, 64)
                 .storeUint(opts.bonusPaytime, 64)
                 .endCell(),
        });
    }

    async sendSetBonusPercent(provider: ContractProvider, via: Sender, value: bigint,
        opts: {
            bonusPercent: bigint
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                 .storeUint(OP.SetBonusPercent, 32)
                 .storeUint(0, 64)
                 .storeUint(opts.bonusPercent, 14)
                 .endCell(),
        });
    }

    async sendSetFirstAffiliatePercent(provider: ContractProvider, via: Sender, value: bigint,
        opts: {
            firstAffiliatePercent: bigint
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                 .storeUint(OP.SetFirstAffiliatePercent, 32)
                 .storeUint(0, 64)
                 .storeUint(opts.firstAffiliatePercent, 14)
                 .endCell(),
        });
    }

    async sendSetSecondAffiliatePercent(provider: ContractProvider, via: Sender, value: bigint,
        opts: {
            secondAffiliatePercent: bigint
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                 .storeUint(OP.SetSecondAffiliatePercent, 32)
                 .storeUint(0, 64)
                 .storeUint(opts.secondAffiliatePercent, 14)
                 .endCell(),
        });
    }

    async parseStorage(provider: ContractProvider) {
        const state = await provider.getState();
        if (state.state.type != 'active') {
            throw Error("Contract is not active");
        }
        const storage = Cell.fromBoc(state.state.data!)[0];
        const storageSlice = storage.asSlice();
        const owner = storageSlice.loadAddress();
        const proposedOwner = storageSlice.loadAddressAny();
        const champ = storageSlice.loadAddress();
        const champBetAmount = storageSlice.loadCoins();
        const champWinTime = storageSlice.loadUintBig(64);

        const storage2 = storageSlice.loadRef();
        const storage2Slice = storage2.asSlice();
        const bonusPaytime = storage2Slice.loadUintBig(64);
        const bonusPercent = storage2Slice.loadUintBig(14);
        const firstAffiliatePercent = storage2Slice.loadUintBig(14);
        const secondAffiliatePercent = storage2Slice.loadUintBig(14);

        return {
            owner, proposedOwner,
            champ, champBetAmount, champWinTime,
            bonusPaytime, bonusPercent,
            firstAffiliatePercent, secondAffiliatePercent
        }
    }

    async getBonusPaytime(provider: ContractProvider): Promise<bigint> {
        const { bonusPaytime } = await this.parseStorage(provider);
        return bonusPaytime;
    }

    async getBonusStatus(provider: ContractProvider) : Promise<[bigint, bigint, bigint]> {
        const result = await provider.get('get_bonus_status', []);
        return [result.stack.readBigNumber(), result.stack.readBigNumber(), result.stack.readBigNumber()];
    }

    async getFeePercent(provider: ContractProvider) : Promise<[bigint, bigint, bigint]> {
        const { bonusPercent, firstAffiliatePercent, secondAffiliatePercent } = await this.parseStorage(provider);
        return [bonusPercent, firstAffiliatePercent, secondAffiliatePercent];
    }

    async getChampion(provider: ContractProvider) : Promise<[Address, bigint, bigint]> {
        const { champ, champBetAmount, champWinTime } = await this.parseStorage(provider);
        return [champ, champBetAmount, champWinTime];
    }

    async getOwnershipInfo(provider: ContractProvider) : Promise<[Address, Address | ExternalAddress | null]> {
        const { owner, proposedOwner } = await this.parseStorage(provider);
        return [owner, proposedOwner];
    }

    async getGasParams(provider: ContractProvider) : Promise<[bigint, bigint, bigint, bigint]> {
        const result = await provider.get('get_gas_params', []);
        return [result.stack.readBigNumber(), result.stack.readBigNumber(), result.stack.readBigNumber(), result.stack.readBigNumber()];
    }

}
