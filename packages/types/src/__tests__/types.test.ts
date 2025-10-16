import { describe, expect, it } from 'vitest';

import type { LessonLevel } from '..';

describe('types', () => {
  it('allows valid lesson levels', () => {
    const levels: LessonLevel[] = ['beginner', 'intermediate', 'advanced'];
    expect(levels).toHaveLength(3);
  });
});
