export interface EventListener {
  (data: string): void;
}

export class EventEmitter {
  private listeners: { [key: string]: EventListener[] } = {};

  on(eventType: string, listener: EventListener): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(listener);
  }

  off(eventType: string, listener: EventListener): void {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter(item => item !== listener);
  }

  emit(eventType: string, event: string): void {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType].forEach(listener => listener(event));
  }
}
