# ton-wars-contract

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## How to use

### Clone and install dependencies

- `git clone --recursive https://github.com/tonwars/ton-wars-contract.git`
- `cd ton-wars-contract`
- `npm install`

### Build

`npm run build`

### Test

`npm run test`

### Deploy or run another script (play, deposit and admin tools)

`npm run start`