import { Address, fromNano, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tonWarsAddress = Address.parse(await ui.input('TON Wars address'));

    const tonWars = provider.open(TonWars.createFromAddress(tonWarsAddress));

    const [champ, champBetAmount, champWinTime] = await tonWars.getChampion();
    const [bonusPercent, firstAffiliatePercent, secondAffiliatePercent] = await tonWars.getFeePercent();
    const betAmount = await ui.input(`Bet amount (current champ bet is ${fromNano(champBetAmount)} TON)`);

    const firstAffiliateInput = await ui.input('First Affiliate');
    const firstAffiliate = firstAffiliateInput.length > 0 ? Address.parse(firstAffiliateInput) : null

    const secondAffiliateInput = await ui.input('Second Affiliate');
    const secondAffiliate = secondAffiliateInput.length > 0 ? Address.parse(secondAffiliateInput) : null

    const sendAmount = toNano(betAmount) * 100n / 95n + 5000000n + 17300000n + (1000008n * 3n);

    await tonWars.sendPlay(provider.sender(),  sendAmount, { firstAffiliate, secondAffiliate });

    ui.clearActionPrompt();
}
