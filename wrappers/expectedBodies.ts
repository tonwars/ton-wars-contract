import { beginCell } from '@ton/core';

const champWin = beginCell().storeUint(0, 32).storeStringTail("You won. Again.").endCell()
const champLose = beginCell().storeUint(0, 32).storeStringTail("You've been defeated.").endCell()

const playerWin = beginCell().storeUint(0, 32).storeStringTail("You beat the champion. Congrats!").endCell()
const playerLose = beginCell().storeUint(0, 32).storeStringTail("Better luck next time.").endCell()

export default {
    champWin,
    champLose,
    playerWin,
    playerLose
}