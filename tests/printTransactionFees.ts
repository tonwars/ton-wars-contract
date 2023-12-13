import {Transaction} from "@ton/core";
import { OP as OPCODES } from "../wrappers/ops";

const decimalCount = 9;
const decimal = pow10(decimalCount);

function pow10(n: number): bigint {
    let v = 1n;
    for (let i = 0; i < n; i++) {
        v *= 10n;
    }
    return v;
}

export function formatCoinsPure(value: bigint, precision = 6): string {
    let whole = value / decimal;

    let frac = value % decimal;
    const precisionDecimal = pow10(decimalCount - precision);
    if (frac % precisionDecimal > 0n) { // round up
        frac += precisionDecimal;
        if (frac >= decimal) {
            frac -= decimal;
            whole += 1n;
        }
    }
    frac /= precisionDecimal;

    return `${whole.toString()}${frac !== 0n ? ('.' + frac.toString().padStart(precision, '0').replace(/0+$/, '')) : ''}`;
}

function formatCoins(value: bigint | undefined, precision = 9): string {
    if (value === undefined) return 'N/A';

    return formatCoinsPure(value, precision) + ' TON';
}

function getOpcodes() {
    const opcodes: { [key: number]: string } = {};
    for (const [key, value] of Object.entries(OPCODES)) {
        opcodes[value] = key;
    }
    return opcodes;
}

export function printTransactionFees(transactions: Transaction[], title: string, addresses: { [key: string]: string }) {
    console.table(
        transactions
            .map((tx) => {
                if (tx.description.type !== 'generic') return undefined;

                const body = tx.inMessage?.info.type === 'internal' ? tx.inMessage?.body.beginParse() : undefined;
                const op = body === undefined ? 'N/A' : (body.remainingBits >= 32 ? body.preloadUint(32) : 'no body');
                const opcodes = getOpcodes();
                const bodyCopy = body;
                const query = bodyCopy === undefined ? 'N/A' : (bodyCopy.remainingBits >= 64 ? bodyCopy.skip(32).loadUintBig(64) : 'no body');
                const totalFees = formatCoins(tx.totalFees.coins);

                const computeFees = formatCoins(
                    tx.description.computePhase.type === 'vm' ? tx.description.computePhase.gasFees : undefined,
                );

                const totalFwdFees = formatCoins(tx.description.actionPhase?.totalFwdFees ?? undefined);
                let origTotalFees = 0n;
                if(tx.description.actionPhase?.totalFwdFees && tx.description.computePhase.type === 'vm') {
                    origTotalFees = tx.description.actionPhase.totalFwdFees + tx.description.computePhase.gasFees;
                }

                const valueIn = formatCoins(
                    tx.inMessage?.info.type === 'internal' ? tx.inMessage.info.value.coins : undefined,
                );

                const valueOut = formatCoins(
                    tx.outMessages
                        .values()
                        .reduce(
                            (total, message) => total + (message.info.type === 'internal' ? message.info.value.coins : 0n),
                            0n,
                        ),
                );

                const forwardIn = formatCoins(
                    tx.inMessage?.info.type === 'internal' ? tx.inMessage.info.forwardFee : undefined,
                );
                return {
                    title,
                    op: typeof op === 'number' ? opcodes[op] != undefined ? opcodes[op] == "DepositBonus" ? "Text Message" : opcodes[op] : op.toString(16) : op,
                    contract: addresses[`${tx.inMessage?.info.dest!.toString()}`],
                    from: tx.inMessage?.info.type === 'internal' ? addresses[tx.inMessage.info.src.toString()] : 'N/A',
                    valueIn,
                    valueOut,
                    totalFees: totalFees,
                    inForwardFee: forwardIn,
                    outForwardFee: totalFwdFees,
                    outActions: tx.description.actionPhase?.totalActions ?? 'N/A',
                    origTotalFees: formatCoins(origTotalFees),
                    computeFee: computeFees,
                    exitCode: tx.description.computePhase.type === 'vm' ? tx.description.computePhase.exitCode : 'N/A',
                    actionCode: tx.description.actionPhase?.resultCode ?? 'N/A',
                    vmSteps: tx.description.computePhase.type === 'vm' ? tx.description.computePhase.vmSteps : 'N/A'
                };
            })
            .filter((v) => v !== undefined),
    );
}