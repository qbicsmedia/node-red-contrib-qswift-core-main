import { EventEmitter, EventListener } from '@dina/util/EventEmitter';

describe('EventEmitter', () => {
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
  });

  describe('on()', () => {
    it('should register an event listener for a given event type', () => {
      const listener: EventListener = jest.fn();
      eventEmitter.on('testEvent', listener);
      expect(eventEmitter['listeners']['testEvent']).toContain(listener);
    });
  });

  describe('off()', () => {
    it('should unregister an event listener for a given event type', () => {
      const listener: EventListener = jest.fn();
      eventEmitter.on('testEvent', listener);
      eventEmitter.off('testEvent', listener);
      expect(eventEmitter['listeners']['testEvent']).not.toContain(listener);
    });

    it('should do nothing if the event type does not exist', () => {
      const listener: EventListener = jest.fn();
      expect(() => eventEmitter.off('nonexistentEvent', listener)).not.toThrow();
    });

    it('should do nothing if the listener is not registered for the event type', () => {
      const listener: EventListener = jest.fn();
      eventEmitter.on('testEvent', jest.fn());
      expect(() => eventEmitter.off('testEvent', listener)).not.toThrow();
    });
  });

  describe('emit()', () => {
    it('should call all registered listeners for a given event type with the event data', () => {
      const listener1: EventListener = jest.fn();
      const listener2: EventListener = jest.fn();
      eventEmitter.on('testEvent', listener1);
      eventEmitter.on('testEvent', listener2);

      eventEmitter.emit('testEvent', 'eventData');
      expect(listener1).toHaveBeenCalledWith('eventData');
      expect(listener2).toHaveBeenCalledWith('eventData');
    });

    it('should do nothing if the event type does not exist', () => {
      expect(() => eventEmitter.emit('nonexistentEvent', 'eventData')).not.toThrow();
    });
  });
});
