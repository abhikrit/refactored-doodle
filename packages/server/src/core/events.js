// Event publisher - IEventPublisher.PublishAsync.
//
// L1 section 6.2 principle 8 / CLAUDE.md: "Event consumers only notify or enqueue
// (consumers swallow exceptions)." No validation and no state change belongs in a consumer:
// a consumer that throws must never break the publisher's transaction.

const consumers = new Map(); // event name -> [{ area, feature, name, fn }]
const published = [];

export function subscribe(eventName, consumer) {
  const list = consumers.get(eventName) ?? [];
  list.push(consumer);
  consumers.set(eventName, list);
}

export async function publishAsync(eventName, payload) {
  published.push({ eventName, at: new Date().toISOString() });
  if (published.length > 500) published.shift();
  for (const c of consumers.get(eventName) ?? []) {
    try {
      await c.fn(payload);
    } catch {
      // swallowed on purpose - see the principle above
    }
  }
}

export function consumerRegister() {
  return [...consumers.entries()].map(([eventName, list]) => ({
    eventName,
    consumers: list.map(({ fn, ...rest }) => rest),
  })).sort((a, b) => a.eventName.localeCompare(b.eventName));
}

export function publishedEvents() {
  return published.slice().reverse();
}

export function resetEvents() {
  consumers.clear();
  published.length = 0;
}
