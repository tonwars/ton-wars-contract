import { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tonWarsAddress = Address.parse(await ui.input('TON Wars address'));

    const tonWars = provider.open(TonWars.createFromAddress(tonWarsAddress));

    const [owner, proposedOwner] = await tonWars.getOwnershipInfo();
    ui.write(`Owner - ${owner.toString()}`)
    ui.write(`Proposed owner - ${proposedOwner ? proposedOwner.toString() : 'not installed'}`)

    // if (provider.sender().address === undefined || proposedOwner == null || !provider.sender().address!.equals(proposedOwner)) {
    //     throw Error("You're not a proposed owner")
    // }

    await tonWars.sendAcceptOwnership(provider.sender(), toNano('0.1'));

    ui.clearActionPrompt();
}