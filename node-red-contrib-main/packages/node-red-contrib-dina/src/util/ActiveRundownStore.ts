import { IDinaRundownExportNodeMessage } from '@dina/nodes/dina-rundown-export';
import { EventEmitter } from 'events';

const PENDING_STORIES_CLEANUP_TIMEOUT = 30000;

export interface Story {
  mRefId: string;
  content?: string;
}

export interface Rundown {
  stories: Story[];
}

export class ActiveRundown extends EventEmitter {
  private id: string;
  private msg: IDinaRundownExportNodeMessage;
  private rundown: Rundown;
  private storyMapping: { [key: string]: Story | null };
  private storyIds: string[];
  private timeout: NodeJS.Timeout | null;

  constructor(rundown: Rundown, id: string, msg: IDinaRundownExportNodeMessage, timeoutInSeconds: number | null) {
    super();

    this.id = id;
    this.msg = msg;
    this.rundown = rundown;
    this.storyMapping = rundown.stories.reduce(
      (memo, story) => {
        memo[story.mRefId] = null;
        return memo;
      },
      {} as { [key: string]: Story | null },
    );

    this.storyIds = Object.keys(this.storyMapping);
    this.timeout =
      typeof timeoutInSeconds === 'number' && timeoutInSeconds > 0
        ? setTimeout(() => this.emit('timeout', this), timeoutInSeconds * 1000)
        : null;
  }

  destroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  updateStory(story: Story): void {
    if (this.storyIds.includes(story.mRefId)) {
      this.storyMapping[story.mRefId] = story;
    }
  }

  getMsg(): object {
    return this.msg;
  }

  getId(): string {
    return this.id;
  }

  getRundown(): { eventId: string; stories: { content: Story | null }[] } {
    return {
      ...this.rundown,
      eventId: this.id,
      stories: this.rundown.stories.map(story => {
        const updatedStory = this.storyMapping[story.mRefId] || null;
        return {
          ...story,
          content: this.transformStoryContent(updatedStory),
        };
      }),
    };
  }

  isComplete(): boolean {
    return this.storyIds.every(storyId => !!this.storyMapping[storyId]);
  }

  private transformStoryContent(story: Story | null): Story | null {
    try {
      return story && typeof story.content === 'string' && story.content.trim().length > 0
        ? JSON.parse(story.content)
        : null;
    } catch (err) {
      return null;
    }
  }
}

export class ActiveRundownStore extends EventEmitter {
  activeRundowns: { [key: string]: ActiveRundown } = {};
  pendingStoryUpdates: { [key: string]: Story[] } = {};
  private pendingStoryUpdatesTimeout: { [key: string]: NodeJS.Timeout } = {};

  constructor() {
    super();
    this.sendTimeoutError = this.sendTimeoutError.bind(this);
  }

  createRundown(
    id: string,
    rundown: Rundown,
    msg: IDinaRundownExportNodeMessage,
    timeoutInSeconds: number | null,
  ): void {
    if (this.activeRundowns[id]) {
      this.removeRundown(id);
    }

    const activeRundown = new ActiveRundown(rundown, id, msg, timeoutInSeconds);
    activeRundown.on('timeout', this.sendTimeoutError);

    this.activeRundowns[id] = activeRundown;
    this.sendStatus();
    this.processPendingStoryUpdates(activeRundown);
  }

  removeRundown(id: string): void {
    const activeRundown = this.activeRundowns[id];

    if (activeRundown) {
      activeRundown.off('timeout', this.sendTimeoutError);
      activeRundown.destroy();
    }

    clearTimeout(this.pendingStoryUpdatesTimeout[id]);

    delete this.activeRundowns[id];
    delete this.pendingStoryUpdates[id];
    delete this.pendingStoryUpdatesTimeout[id];

    this.sendStatus();
  }

  updateStory(story: Story, dependsOn: string): void {
    const activeRundown = this.activeRundowns[dependsOn];

    if (!activeRundown) {
      this.addPendingStoryUpdate(story, dependsOn);
      return;
    }

    this.processStoryUpdate(activeRundown, story);
  }

  private processStoryUpdate(activeRundown: ActiveRundown, story: Story): void {
    activeRundown.updateStory(story);

    if (activeRundown.isComplete()) {
      this.removeRundown(activeRundown.getId());
      this.emit('complete', activeRundown);
    }
  }

  private addPendingStoryUpdate(story: Story, dependsOn: string): void {
    if (!this.pendingStoryUpdates[dependsOn]) {
      this.pendingStoryUpdates[dependsOn] = [];
      // NOTE: clean up pending story updates if they aren't used after a short time
      this.pendingStoryUpdatesTimeout[dependsOn] = setTimeout(() => {
        delete this.pendingStoryUpdates[dependsOn];
        delete this.pendingStoryUpdatesTimeout[dependsOn];
      }, PENDING_STORIES_CLEANUP_TIMEOUT);
    }
    this.pendingStoryUpdates[dependsOn].push(story);
  }

  private processPendingStoryUpdates(activeRundown: ActiveRundown): void {
    const id = activeRundown.getId();

    clearTimeout(this.pendingStoryUpdatesTimeout[id]);

    const pendingStories = this.pendingStoryUpdates[id] || [];
    pendingStories.forEach(story => this.processStoryUpdate(activeRundown, story));

    delete this.pendingStoryUpdates[id];
    delete this.pendingStoryUpdatesTimeout[id];
  }

  private sendStatus(): void {
    this.emit('status', { activeRundownCount: Object.keys(this.activeRundowns).length });
  }

  private sendTimeoutError(activeRundown: ActiveRundown): void {
    this.emit('timeout', activeRundown);
    this.removeRundown(activeRundown.getId());
  }
}
