import gleam/list

pub type Item {
  Item(id: String, text: String, speaker: String)
}

pub type State {
  Idle(queue: List(Item))
  Processing(current: Item, queue: List(Item))
}

pub type Event {
  Enqueue(item: Item)
  CurrentFinished(id: String)
  Clear
}

pub type Command {
  Start(item: Item)
  Stop
}

pub fn new() -> State {
  Idle([])
}

pub fn new_item(id: String, text: String, speaker: String) -> Item {
  Item(id:, text:, speaker:)
}

pub fn enqueue(state: State, item: Item) -> #(State, List(Command)) {
  update(state, Enqueue(item))
}

pub fn current_finished(state: State, id: String) -> #(State, List(Command)) {
  update(state, CurrentFinished(id))
}

pub fn clear(state: State) -> #(State, List(Command)) {
  update(state, Clear)
}

pub fn update(state: State, event: Event) -> #(State, List(Command)) {
  case state, event {
    Idle(queue), Enqueue(item) ->
      case queue {
        [] -> #(Processing(item, []), [Start(item)])
        _ -> #(Idle(list.append(queue, [item])), [])
      }

    Processing(current, queue), Enqueue(item) ->
      #(Processing(current, list.append(queue, [item])), [])

    Processing(current, queue), CurrentFinished(id) if current.id == id ->
      case queue {
        [] -> #(Idle([]), [])
        [next, ..rest] -> #(Processing(next, rest), [Start(next)])
      }

    _, Clear -> #(Idle([]), [Stop])

    _, _ -> #(state, [])
  }
}
