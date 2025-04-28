import { ponder } from "ponder:registry";
import { yoinks } from "ponder:schema";

ponder.on("Yoink:Yoinked", async ({ event, context }) => {
  await context.db.insert(yoinks).values({
    id: event.id,
    timestamp: event.block.timestamp,
    by: event.args.by,
    from: event.args.from,
  });
});
