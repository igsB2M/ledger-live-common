import invariant from "invariant";
import type { Account } from "../../types";
import type { Transaction } from "./types";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import { inferFeePerByte } from "./logic";

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  let networkInfo = t.networkInfo;

  if (!networkInfo) {
    networkInfo = await getAccountNetworkInfo(a);
    invariant(networkInfo.family === "bitcoin", "bitcoin networkInfo expected");
  }

  const feePerByte = inferFeePerByte(t, networkInfo);

  if (
    t.networkInfo === networkInfo &&
    (feePerByte === t.feePerByte || feePerByte.eq(t.feePerByte || 0))
  ) {
    // nothing changed
    return t;
  }

  return {
    ...t,
    networkInfo,
    feePerByte,
  };
};

export default prepareTransaction;
