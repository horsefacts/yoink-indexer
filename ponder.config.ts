import { createConfig } from "@ponder/core";
import { http } from "viem";

import { YoinkAbi } from "./abis/YoinkAbi";

export default createConfig({
  networks: {
    baseSepolia: {
      chainId: 84532,
      transport: http(process.env.PONDER_RPC_URL_84532),
    },
  },
  contracts: {
    Yoink: {
      abi: YoinkAbi,
      address: "0xD4e679003679F84eDa0e8fa973D0F62c7dEA29C4",
      network: "baseSepolia",
      startBlock: 17439250,
    },
  },
});
