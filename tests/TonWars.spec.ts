import { Blockchain, BlockchainTransaction, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, address, Cell, toNano } from '@ton/core';
import { TonWars } from '../wrappers/TonWars';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import expectedBodies from '../wrappers/expectedBodies';
import { printTransactionFees } from './printTransactionFees';

describe('TonWars', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let tonWars: SandboxContract<TonWars>;
    let owner: SandboxContract<TreasuryContract>;
    let games: {player: SandboxContract<TreasuryContract>, betAmount: bigint}[];

    beforeAll(async () => {
        code = await compile('TonWars');
        blockchain = await Blockchain.create();
        blockchain.now = 1;

        owner = await blockchain.treasury('owner');

        games = []
        games.push({player: owner, betAmount: toNano('0')})
        games.push({player: await blockchain.treasury('player1'), betAmount: toNano('10')})
        games.push({player: await blockchain.treasury('player2'), betAmount: toNano('1.5')})
        games.push({player: await blockchain.treasury('player2'), betAmount: toNano('1000')})

        tonWars = blockchain.openContract(TonWars.createFromConfig({ owner: owner.address }, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await tonWars.sendDeploy(deployer.getSender(), toNano('100'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tonWars.address,
            deploy: true,
            success: true,
        });

        expect(deployResult.transactions).toHaveTransaction({
            from: tonWars.address,
            to: deployer.address,
            op: 0
        });
    });

    it('should deploy', async () => {
        let [champ, champBetAmount, champWinTime] = await tonWars.getChampion();
        expect(champ).toEqualAddress(games[0].player.address);
        expect(champBetAmount).toEqual(0n)
        expect(champWinTime).toEqual(0n);

        let [gasCfgHash, gasPrice, flatGasLimit, flatGasPrice] = await tonWars.getGasParams();
        expect(gasCfgHash).toBeGreaterThan(0);
        expect(gasPrice).toBeGreaterThan(0);
        expect(flatGasLimit).toBeGreaterThan(0);
        expect(flatGasPrice).toBeGreaterThan(0);
        console.log(gasCfgHash, gasPrice, flatGasLimit, flatGasPrice)
    });

    it('should first win game', async () => {
        blockchain.now! += 100;

        const player = games[1].player.getSender();
        const playResult = await tonWars.sendPlay(player, games[1].betAmount, { firstAffiliate: player.address, secondAffiliate: player.address });

        expect(playResult.transactions).toHaveTransaction({
            from: games[1].player.address,
            to: tonWars.address,
            success: true
        });

        expect(playResult.transactions).toHaveTransaction({
            from: tonWars.address,
            to: games[1].player.address,
            body: expectedBodies.playerWin,
            value: 0n
        });

        expect(playResult.transactions).toHaveTransaction({
            from: tonWars.address,
            to: games[0].player.address,
            body: expectedBodies.champLose
        });

        printTransactionFees(playResult.transactions, "win game", {[games[1].player.address.toString()]: "player", [tonWars.address.toString()]: "tonWars", [games[0].player.address.toString()]: "champ"})

        let [champ, champBetAmount, champWinTime] = await tonWars.getChampion();
        expect(champ).toEqualAddress(games[1].player.address);
        expect(champBetAmount).toBeGreaterThan(games[1].betAmount * 9n / 10n);
        expect(champWinTime).toEqual(BigInt(blockchain.now!));
    });

    it('should lose game', async () => {
        // blockchain.now! += 129600 / 100;
        const player = games[2].player.getSender()
        const playResult = await tonWars.sendPlay(player, games[2].betAmount, { firstAffiliate: player.address, secondAffiliate: player.address });

        expect(playResult.transactions).toHaveTransaction({
            from: games[2].player.address,
            to: tonWars.address,
            success: true
        });

        expect(playResult.transactions).toHaveTransaction({
            from: tonWars.address,
            to: games[2].player.address,
            body: expectedBodies.playerLose,
            value: 0n
        });

        expect(playResult.transactions).toHaveTransaction({
            from: tonWars.address,
            to: games[1].player.address,
            body: expectedBodies.champWin
        });

        printTransactionFees(playResult.transactions, "lose game", {[games[2].player.address.toString()]: "player", [tonWars.address.toString()]: "tonWars", [games[1].player.address.toString()]: "champ"})

        let [champ, champBetAmount, champWinTime] = await tonWars.getChampion();
        expect(champ).toEqualAddress(games[1].player.address);
    });

    it('should again win game', async () => {
        blockchain.now! += 129600;

        let [champ, champBetAmount, champWinTime] = await tonWars.getChampion();

        const player = games[3].player.getSender();
        const playResult = await tonWars.sendPlay(player, games[3].betAmount, { firstAffiliate: player.address, secondAffiliate: player.address });

        expect(playResult.transactions).toHaveTransaction({
            from: games[3].player.address,
            to: tonWars.address,
            success: true
        });

        expect(playResult.transactions).toHaveTransaction({
            from: tonWars.address,
            to: games[3].player.address,
            body: expectedBodies.playerWin,
            value: champBetAmount
        });

        expect(playResult.transactions).toHaveTransaction({
            from: tonWars.address,
            to: games[1].player.address,
            body: expectedBodies.champLose
        });

        printTransactionFees(playResult.transactions, "again win game", {[games[3].player.address.toString()]: "player", [tonWars.address.toString()]: "tonWars", [games[1].player.address.toString()]: "champ"});

        [champ, champBetAmount, champWinTime] = await tonWars.getChampion();
        expect(champ).toEqualAddress(games[3].player.address);
        expect(champWinTime).toEqual(BigInt(blockchain.now!));
    });
});
