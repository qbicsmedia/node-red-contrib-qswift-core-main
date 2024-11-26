import { createTextList } from '../../src/lib/textSplitter';

describe('createTextList', () => {
  const testText =
    'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt.';

  it('should split text according to maxChunkChars and split chars', () => {
    const textList = createTextList(testText, 100);

    expect(textList).toBeInstanceOf(Array);
    expect(textList.length).toBe(7);
  });

  it('should return list with whole text as single entry when maxChunkChars is greater or equal than text chars', () => {
    const text = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.';
    const textList = createTextList(text, text.length);

    expect(textList).toBeInstanceOf(Array);
    expect(textList.length).toBe(1);
    expect(textList[0]).toBe(text);
  });

  it('should split text at maxChunkChars if no split chars are found', () => {
    const maxChunkChars = 20;
    const text = 'Loremipsumdolorsitamet,consectetueradipiscingelit';
    const textList = createTextList(text, maxChunkChars);

    expect(textList).toBeInstanceOf(Array);
    expect(textList.length).toBe(3);

    textList.forEach((item, idx) => {
      expect(item).toEqual(text.slice(maxChunkChars * idx, maxChunkChars * (idx + 1)));
    });
  });

  it.each([
    { value: true, type: typeof true },
    { value: undefined, type: typeof undefined },
    { value: {}, type: typeof {} },
    { value: 10, type: typeof 10 },
  ])('should return an empty array if text parameter is not a string (type: $type)', ({ value }) => {
    // @ts-expect-error so wrong types can be passed into the function
    const textList = createTextList(value, 20);

    expect(textList).toBeInstanceOf(Array);
    expect(textList.length).toBe(0);
  });

  it.each([
    { value: true, type: typeof true },
    { value: undefined, type: typeof undefined },
    { value: {}, type: typeof {} },
    { value: 'hello', type: typeof 'hello' },
  ])('should return an empty array if maxChunkChars parameter is not a number (type: $type)', ({ value }) => {
    // @ts-expect-error so wrong types can be passed into the function
    const textList = createTextList(testText, value);

    expect(textList).toBeInstanceOf(Array);
    expect(textList.length).toBe(0);
  });
});
