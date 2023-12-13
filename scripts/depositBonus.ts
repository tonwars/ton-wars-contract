import { Address, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tonWarsAddress = Address.parse(await ui.input('TON Wars address'));
    const depositAmount = await ui.input('Deposit amount');
    const message = await ui.input('Message');

    const tonWars = provider.open(TonWars.createFromAddress(tonWarsAddress));

    await tonWars.sendDepositBonus(provider.sender(), toNano(depositAmount), { message });

    ui.clearActionPrompt();
}
