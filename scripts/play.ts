import { Address, fromNano, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tonWarsAddress = Address.parse(await ui.input('TON Wars address'));

    const tonWars = provider.open(TonWars.createFromAddress(tonWarsAddress));

    const [champ, champBetAmount, champWinTime] = await tonWars.getChampion();
    const betAmount = await ui.input(`Bet amount (current champ bet is ${fromNano(champBetAmount)} TON)`);

    const firstAffiliateInput = await ui.input('First Affiliate');
    const firstAffiliate = firstAffiliateInput.length > 0 ? Address.parse(firstAffiliateInput) : null

    const secondAffiliateInput = await ui.input('Second Affiliate');
    const secondAffiliate = secondAffiliateInput.length > 0 ? Address.parse(secondAffiliateInput) : null

    await tonWars.sendPlay(provider.sender(), toNano(betAmount), { firstAffiliate, secondAffiliate });

    ui.clearActionPrompt();
}
