import { createConfig } from "ponder";
import { http } from "viem";

import { YoinkAbi } from "./abis/YoinkAbi";

export default createConfig({
  networks: {
    base: { chainId: 8453, transport: http(process.env.PONDER_RPC_URL_8453) },
  },
  contracts: {
    Yoink: {
      abi: YoinkAbi,
      address: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
      network: "base",
    },
  },
});
