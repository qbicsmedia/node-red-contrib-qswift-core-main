import { IDinaRundownExportNodeMessage } from '@dina/nodes/dina-rundown-export';
import { ActiveRundown, ActiveRundownStore, Rundown, Story } from '@dina/util/ActiveRundownStore';

jest.useFakeTimers();

describe('ActiveRundown', () => {
  let activeRundown: ActiveRundown;
  let msg: IDinaRundownExportNodeMessage;

  beforeEach(() => {
    msg = {} as IDinaRundownExportNodeMessage;
    const rundown: Rundown = {
      stories: [
        { mRefId: '1', content: 'content1' },
        { mRefId: '2', content: 'content2' },
      ],
    };

    activeRundown = new ActiveRundown(rundown, 'test-id', msg, 30);
  });

  it('should initialize correctly', () => {
    expect(activeRundown.getId()).toBe('test-id');
    expect(activeRundown.getMsg()).toBe(msg);
    expect(activeRundown.getRundown()).toEqual({
      eventId: 'test-id',
      stories: [
        { mRefId: '1', content: null },
        { mRefId: '2', content: null },
      ],
    });
  });

  it('should update a story', () => {
    const story: Story = {
      mRefId: '1',
      content: JSON.stringify({
        mRefId: '1',
        published: true,
        views: 1024,
      }),
    };
    activeRundown.updateStory(story);
    expect(activeRundown.getRundown().stories[0].content).toEqual({
      mRefId: '1',
      published: true,
      views: 1024,
    });
  });

  it('should mark as complete when all stories are updated', () => {
    const story1: Story = { mRefId: '1', content: 'updatedContent1' };
    const story2: Story = { mRefId: '2', content: 'updatedContent2' };

    activeRundown.updateStory(story1);
    activeRundown.updateStory(story2);

    expect(activeRundown.isComplete()).toBe(true);
  });

  it('should handle story content transformation', () => {
    const story: Story = { mRefId: '1', content: '{"transformed": true}' };
    activeRundown.updateStory(story);

    expect(activeRundown.getRundown().stories[0].content).toEqual({ transformed: true });
  });

  it('should clear timeout on destroy', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    activeRundown.destroy();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

describe('ActiveRundownStore', () => {
  let store: ActiveRundownStore;

  beforeEach(() => {
    store = new ActiveRundownStore();
  });

  it('createRundown should add a new rundown and emit status', () => {
    const mockEmit = jest.spyOn(store, 'emit');
    const rundown: Rundown = {
      stories: [
        { mRefId: '1', content: 'content1' },
        { mRefId: '2', content: 'content2' },
      ],
    };
    const story: Story = { mRefId: '1', content: 'updatedContent1' };
    const msg: IDinaRundownExportNodeMessage = {
      message: 'hello',
      payload: {
        event: '',
        type: '',
        id: '',
        dependsOn: '',
        rundown: rundown,
        story: story,
      },
      _msgid: '',
    };

    store.createRundown('1', rundown, msg, 30);

    expect(store.activeRundowns).toHaveProperty('1');
    expect(mockEmit).toHaveBeenCalledWith('status', { activeRundownCount: 1 });
  });

  it('removeRundown should remove a rundown and emit status', () => {
    const mockEmit = jest.spyOn(store, 'emit');
    const rundown: Rundown = {
      stories: [
        { mRefId: '1', content: 'content1' },
        { mRefId: '2', content: 'content2' },
      ],
    };
    const story: Story = { mRefId: '1', content: 'updatedContent1' };
    const msg: IDinaRundownExportNodeMessage = {
      message: 'hello',
      payload: {
        event: '',
        type: '',
        id: '',
        dependsOn: '',
        rundown: rundown,
        story: story,
      },
      _msgid: '',
    };

    store.createRundown('1', rundown, msg, 30);
    store.removeRundown('1');

    expect(store.activeRundowns).not.toHaveProperty('1');
    expect(mockEmit).toHaveBeenCalledWith('status', { activeRundownCount: 0 });
  });

  it('updateStory should process a story update or add it to pending updates', () => {
    const story: Story = { mRefId: '1', content: 'content 3' };

    store.updateStory(story, '1');
    expect(store.pendingStoryUpdates['1']).toEqual([{ content: 'content 3', mRefId: '1' }]);
  });

  it('addPendingStoryUpdate should store the story for later processing', () => {
    const story: Story = { mRefId: '1', content: 'Some content' };

    store.updateStory(story, '1');

    expect(store.pendingStoryUpdates['1']).toContain(story);
  });

  it('sendTimeoutError should emit a timeout event and remove the rundown', () => {
    const mockEmit = jest.spyOn(store, 'emit');
    const rundown: Rundown = { stories: [] };
    const story: Story = { mRefId: '1', content: 'updatedContent3' };

    const msg: IDinaRundownExportNodeMessage = {
      payload: {
        event: '',
        type: '',
        id: '',
        dependsOn: '',
        rundown: rundown,
        story: story,
      },
      _msgid: '',
    };

    store.createRundown('1', rundown, msg, 30);
    const activeRundown = store.activeRundowns['1'];
    if (activeRundown) {
      activeRundown.emit('timeout', activeRundown);
    }

    expect(mockEmit).toHaveBeenCalledWith('timeout', activeRundown);
    expect(store.activeRundowns).not.toHaveProperty('1');
  });
});
