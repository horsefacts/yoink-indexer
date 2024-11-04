import { ponder } from "@/generated";

ponder.on("Yoink:ApprovalForAll", async ({ event, context }) => {
  console.log(event.args);
});

ponder.on("Yoink:TransferBatch", async ({ event, context }) => {
  console.log(event.args);
});

ponder.on("Yoink:TransferSingle", async ({ event, context }) => {
  console.log(event.args);
});

ponder.on("Yoink:URI", async ({ event, context }) => {
  console.log(event.args);
});
