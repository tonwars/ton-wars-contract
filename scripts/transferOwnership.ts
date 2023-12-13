import { Address, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tonWarsAddress = Address.parse(await ui.input('TON Wars address'));
    const newProposedOwner = Address.parse(await ui.input('Proposed owner address'));

    const tonWars = provider.open(TonWars.createFromAddress(tonWarsAddress));
    const [owner, proposedOwner] = await tonWars.getOwnershipInfo();
    ui.write(`Owner - ${owner.toString()}`)
    ui.write(`Current proposed owner - ${proposedOwner ? proposedOwner.toString() : 'not installed'}`)

    await tonWars.sendTransferOwnership(provider.sender(), toNano('0.1'), {proposedOwner: newProposedOwner});

    ui.clearActionPrompt();
}
