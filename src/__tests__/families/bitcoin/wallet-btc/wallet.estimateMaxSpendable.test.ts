import { DerivationModes } from "../../../../families/bitcoin/wallet-btc/types";
import BitcoinLikeWallet from "../../../../families/bitcoin/wallet-btc/wallet";
import * as utils from "../../../../families/bitcoin/wallet-btc/utils";
import { Account } from "../../../../families/bitcoin/wallet-btc/account";

describe("testing estimateMaxSpendable", () => {
  const wallet = new BitcoinLikeWallet();
  let account: Account;
  it("should generate an account", async () => {
    account = await wallet.generateAccount({
      xpub: "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP",
      path: "44'/0'",
      index: 0,
      currency: "bitcoin",
      network: "mainnet",
      derivationMode: DerivationModes.LEGACY,
      explorer: "ledgerv3",
      explorerURI: "https://explorers.api.vault.ledger.com/blockchain/v3/btc",
      storage: "mock",
      storageParams: [],
    });

    expect(account.xpub.xpub).toEqual(
      "xpub6CV2NfQJYxHn7MbSQjQip3JMjTZGUbeoKz5xqkBftSZZPc7ssVPdjKrgh6N8U1zoQDxtSo6jLarYAQahpd35SJoUKokfqf1DZgdJWZhSMqP"
    );
  });

  it("should estimate max spendable correctly", async () => {
    await wallet.syncAccount(account);
    let maxSpendable = await wallet.estimateAccountMaxSpendable(
      account,
      0,
      [],
      true
    );
    const balance = 109088;
    expect(maxSpendable.toNumber()).toEqual(balance);
    const maxSpendableExcludeUtxo = await wallet.estimateAccountMaxSpendable(
      account,
      0,
      [
        {
          hash: "f80246be50064bb254d2cad82fb0d4ce7768582b99c113694e72411f8032fd7a",
          outputIndex: 0,
        },
      ],
      true
    );
    expect(maxSpendableExcludeUtxo.toNumber()).toEqual(balance - 1000);
    let feesPerByte = 100;
    maxSpendable = await wallet.estimateAccountMaxSpendable(
      account,
      feesPerByte,
      [],
      true
    );
    expect(maxSpendable.toNumber()).toEqual(
      balance -
        feesPerByte *
          utils.estimateTxSize(
            2,
            1,
            account.xpub.crypto,
            account.xpub.derivationMode
          )
    );
    feesPerByte = 10000;
    maxSpendable = await wallet.estimateAccountMaxSpendable(
      account,
      feesPerByte,
      [],
      true
    );
    expect(maxSpendable.toNumber()).toEqual(0);
  }, 60000);
});
