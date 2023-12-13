import { Address, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tonWarsAddress = Address.parse(await ui.input('TON Wars address'));
    const tonWars = provider.open(TonWars.createFromAddress(tonWarsAddress));

    const bonusPaytime = await tonWars.getBonusPaytime();
    const newBonusPaytime = await ui.input(`New bonus paytime (current is ${bonusPaytime})`);

    await tonWars.sendSetBonusPaytime(provider.sender(), toNano('0.1'), { bonusPaytime: BigInt(newBonusPaytime) });

    ui.clearActionPrompt();
}
