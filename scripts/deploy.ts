import { Address, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const owner = Address.parse(await ui.input('Owner(admin) address'));

    const tonWars = provider.open(TonWars.createFromConfig({owner}, await compile('TonWars')));

    await tonWars.sendDeploy(provider.sender(), toNano('0.1'));

    await provider.waitForDeploy(tonWars.address);
}
