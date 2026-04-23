import gleeunit
import message_queue.{Idle, Processing, Start}

pub fn main() -> Nil {
  gleeunit.main()
}

pub fn enqueue_starts_first_item_test() {
  let item = message_queue.new_item("1", "hello", "speaker")
  let #(state, commands) = message_queue.enqueue(message_queue.new(), item)

  assert state == Processing(item, [])
  assert commands == [Start(item)]
}

pub fn enqueue_during_processing_waits_test() {
  let first = message_queue.new_item("1", "hello", "speaker")
  let second = message_queue.new_item("2", "world", "speaker")
  let #(state, _) = message_queue.enqueue(message_queue.new(), first)
  let #(state, commands) = message_queue.enqueue(state, second)

  assert state == Processing(first, [second])
  assert commands == []
}

pub fn current_finished_starts_next_item_test() {
  let first = message_queue.new_item("1", "hello", "speaker")
  let second = message_queue.new_item("2", "world", "speaker")
  let #(state, _) = message_queue.enqueue(message_queue.new(), first)
  let #(state, _) = message_queue.enqueue(state, second)
  let #(state, commands) = message_queue.current_finished(state, "1")

  assert state == Processing(second, [])
  assert commands == [Start(second)]
}

pub fn current_finished_ignores_stale_item_test() {
  let item = message_queue.new_item("1", "hello", "speaker")
  let #(state, _) = message_queue.enqueue(message_queue.new(), item)
  let #(state, commands) = message_queue.current_finished(state, "old")

  assert state == Processing(item, [])
  assert commands == []
}

pub fn clear_stops_processing_test() {
  let item = message_queue.new_item("1", "hello", "speaker")
  let #(state, _) = message_queue.enqueue(message_queue.new(), item)
  let #(state, commands) = message_queue.clear(state)

  assert state == Idle
  assert commands == [message_queue.Stop]
}

pub fn clear_idle_does_not_stop_test() {
  let #(state, commands) = message_queue.clear(message_queue.new())

  assert state == Idle
  assert commands == []
}
