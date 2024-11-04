import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  Yoink: p.createTable({
    id: p.string(),
    timestamp: p.bigint(),
    by: p.hex(),
    from: p.hex()
  }),
}));
