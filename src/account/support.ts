import {
  AccountNotSupported,
  CurrencyNotSupported,
  UnavailableTezosOriginatedAccountReceive,
} from "@ledgerhq/errors";
import type {
  Account,
  AccountLike,
  CryptoCurrency,
  DerivationMode,
} from "../types";
import { getEnv } from "../env";
import { decodeAccountId } from "./accountId";
import {
  getAllDerivationModes,
  getDerivationModesForCurrency,
} from "../derivation";
import { isCurrencySupported } from "../currencies";
import { getMainAccount } from "../account";
import { getAccountBridge } from "../bridge";
import jsBridges from "../generated/bridge/js";

const experimentalIntegrations = [
  "bitcoin",
  "bsc",
  "bitcoin_cash",
  "litecoin",
  "dash",
  "qtum",
  "zcash",
  "bitcoin_gold",
  "stratis",
  "dogecoin",
  "digibyte",
  "komodo",
  "pivx",
  "zencash",
  "vertcoin",
  "peercoin",
  "viacoin",
  "stakenet",
  "stealthcoin",
  "decred",
  "bitcoin_testnet",
  "tezos",
];
export function shouldUseJS(currency: CryptoCurrency) {
  const jsBridge = jsBridges[currency.family];
  if (!jsBridge) return false;

  if (experimentalIntegrations.includes(currency.id)) {
    return getEnv("EXPERIMENTAL_CURRENCIES_JS_BRIDGE")
      .split(",")
      .includes(currency.id);
  }

  return true;
}
export const libcoreNoGoBalanceHistory = () =>
  getEnv("LIBCORE_BALANCE_HISTORY_NOGO").split(",");
export const shouldShowNewAccount = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode
) => {
  const modes = getDerivationModesForCurrency(currency);
  // last mode is always creatable by convention
  if (modes[modes.length - 1] === derivationMode) return true;
  // legacy is only available with flag SHOW_LEGACY_NEW_ACCOUNT
  if (
    derivationMode === "" &&
    (!!getEnv("SHOW_LEGACY_NEW_ACCOUNT") || currency.family === "bitcoin")
  )
    return true;
  // native segwit being not yet supported everywhere, segwit is always available for creation
  if (
    derivationMode === "segwit" ||
    (currency.family === "bitcoin" &&
      (derivationMode === "native_segwit" || derivationMode === "taproot"))
  )
    return true;
  return false;
};
export const getReceiveFlowError = (
  account: AccountLike,
  parentAccount: Account | null | undefined
): Error | null | undefined => {
  if (parentAccount && parentAccount.currency.id === "tezos") {
    return new UnavailableTezosOriginatedAccountReceive("");
  }
};
export function canSend(
  account: AccountLike,
  parentAccount: Account | null | undefined
): boolean {
  try {
    getAccountBridge(account, parentAccount).createTransaction(
      getMainAccount(account, parentAccount)
    );
    return true;
  } catch (e) {
    return false;
  }
}
export function canBeMigrated(account: Account) {
  try {
    const { version } = decodeAccountId(account.id);

    if (getEnv("MOCK")) {
      return version === "0";
    }

    return false;
  } catch (e) {
    return false;
  }
}
// attempt to find an account in scanned accounts that satisfy a migration
export function findAccountMigration(
  account: Account,
  scannedAccounts: Account[]
): Account | null | undefined {
  if (!canBeMigrated(account)) return;

  if (getEnv("MOCK")) {
    return scannedAccounts.find(
      (a) =>
        a.id !== account.id && // a migration assume an id changes
        a.currency === account.currency &&
        a.freshAddress === account.freshAddress
    );
  }
}
export function checkAccountSupported(
  account: Account
): Error | null | undefined {
  if (!getAllDerivationModes().includes(account.derivationMode)) {
    return new AccountNotSupported(
      "derivation not supported " + account.derivationMode,
      {
        reason: account.derivationMode,
      }
    );
  }

  if (!isCurrencySupported(account.currency)) {
    return new CurrencyNotSupported("currency not supported", {
      currencyName: account.currency.name,
    });
  }
}
