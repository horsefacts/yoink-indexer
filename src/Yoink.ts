import { ponder } from "@/generated";

ponder.on("Yoink:Yoinked", async ({ event, context }) => {
  const { Yoink } = context.db;

  await Yoink.create({
    id: event.log.id,
    data: {
      timestamp: event.block.timestamp,
      by: event.args.by,
      from: event.args.from
    }
  });
});
