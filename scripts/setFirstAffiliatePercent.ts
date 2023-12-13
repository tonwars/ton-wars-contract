import { Address, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tonWarsAddress = Address.parse(await ui.input('TON Wars address'));
    const tonWars = provider.open(TonWars.createFromAddress(tonWarsAddress));

    const [bonusPercent, firstAffiliatePercent, secondAffiliatePercent] = await tonWars.getFeePercent();

    const newFirstAffiliatePercent = await ui.input(`New first affiliate percent (current is ${firstAffiliatePercent} points); 1 percent is 100 points.`);

    await tonWars.sendSetFirstAffiliatePercent(provider.sender(), toNano('0.1'), { firstAffiliatePercent: BigInt(newFirstAffiliatePercent) });

    ui.clearActionPrompt();
}
