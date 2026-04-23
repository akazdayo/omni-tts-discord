import * as messageQueue from "../../message_queue/build/dev/javascript/message_queue/message_queue.mjs";

export interface QueueItem {
  readonly id: string;
  readonly speaker: string;
  readonly text: string;
}

export type QueueCommand =
  | {
      readonly item: QueueItem;
      readonly type: "start";
    }
  | {
      readonly type: "stop";
    };

type GleamItem = messageQueue.Item$;
type GleamState = messageQueue.State$;
type GleamCommand = messageQueue.Command$;

type QueueUpdate = [GleamState, Iterable<GleamCommand>];

const toQueueItem = (item: GleamItem): QueueItem => ({
  id: messageQueue.Item$Item$id(item),
  speaker: messageQueue.Item$Item$speaker(item),
  text: messageQueue.Item$Item$text(item),
});

const toQueueCommand = (command: GleamCommand): QueueCommand | undefined => {
  if (messageQueue.Command$isStart(command)) {
    return {
      item: toQueueItem(messageQueue.Command$Start$item(command)),
      type: "start",
    };
  }

  if (messageQueue.Command$isStop(command)) {
    return { type: "stop" };
  }

  return undefined;
};

const toQueueCommands = (commands: Iterable<GleamCommand>): QueueCommand[] =>
  [...commands].flatMap((command) => {
    const queueCommand = toQueueCommand(command);
    return queueCommand ? [queueCommand] : [];
  });

export class BotMessageQueue {
  #state: GleamState = messageQueue.initial_state();

  currentItemId(): string | undefined {
    if (!messageQueue.State$isProcessing(this.#state)) {
      return undefined;
    }

    return messageQueue.Item$Item$id(messageQueue.State$Processing$current(this.#state));
  }

  enqueue(item: QueueItem): QueueCommand[] {
    return this.#applyUpdate(
      messageQueue.enqueue_state(
        this.#state,
        messageQueue.new_item(item.id, item.text, item.speaker),
      ),
    );
  }

  currentFinished(itemId: string): QueueCommand[] {
    return this.#applyUpdate(messageQueue.current_finished_state(this.#state, itemId));
  }

  clear(): QueueCommand[] {
    return this.#applyUpdate(messageQueue.clear_state(this.#state));
  }

  #applyUpdate([nextState, commands]: QueueUpdate): QueueCommand[] {
    this.#state = nextState;
    return toQueueCommands(commands);
  }
}
