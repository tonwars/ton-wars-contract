import { Address, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tonWarsAddress = Address.parse(await ui.input('TON Wars address'));

    const tonWars = provider.open(TonWars.createFromAddress(tonWarsAddress));

    const [bonusPercent, firstAffiliatePercent, secondAffiliatePercent] = await tonWars.getFeePercent();

    const newBonusPercent = await ui.input(`New bonus percent (current is ${bonusPercent} points); 1 percent is 100 points.`);

    await tonWars.sendSetBonusPercent(provider.sender(), toNano('0.1'), { bonusPercent: BigInt(newBonusPercent) });

    ui.clearActionPrompt();
}
