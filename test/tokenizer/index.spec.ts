import { expect } from 'chai';
import { scanToken } from '../../src/tokenizer';

/* eslint prefer-arrow-callback: 0 */
describe('scan', function () {
  const initState = (input: string) => ({
    input,
    start: 0,
    end: input.length - 1,
    position: -1,
  });

  it('scans inline comments', function () {
    const actual = scanToken(initState('-- my comment'));
    const expected = {
      type: 'comment-inline',
      value: '-- my comment',
      start: 0,
      end: 12,
    };
    expect(actual).to.eql(expected);
  });

  it('scans block comments', function () {
    const commentBlock = '/*\n * This is my comment block\n */';
    const actual = scanToken(initState(commentBlock));
    const expected = {
      type: 'comment-block',
      value: commentBlock,
      start: 0,
      end: 33,
    };
    expect(actual).to.eql(expected);
  });

  it('scans white spaces', function () {
    const actual = scanToken(initState('   \n\t\r  '));
    const expected = {
      type: 'whitespace',
      value: '   \n\t\r  ',
      start: 0,
      end: 7,
    };
    expect(actual).to.eql(expected);
  });

  it('scans SELECT keyword', function () {
    const actual = scanToken(initState('SELECT'));
    const expected = {
      type: 'keyword',
      value: 'SELECT',
      start: 0,
      end: 5,
    };
    expect(actual).to.eql(expected);
  });

  it('scans quoted keyword', function () {
    const actual = scanToken(initState('"ta;\'`ble"'));
    const expected = {
      type: 'keyword',
      value: '"ta;\'`ble"',
      start: 0,
      end: 9,
    };
    expect(actual).to.eql(expected);
  });

  it('scans quoted string', function () {
    const actual = scanToken(initState("'some string; I \"love it\"'"), "mysql");
    const expected = {
      type: 'string',
      value: "'some string; I \"love it\"'",
      start: 0,
      end: 25,
    };
    expect(actual).to.eql(expected);
  });

  it('scans quoted string', function () {
    const actual = scanToken(initState("'''foo'' bar'"), "mysql");
    const expected = {
      type: 'string',
      value: "'''foo'' bar'",
      start: 0,
      end: 12,
    };
    expect(actual).to.eql(expected);
  });

  it('scans INSERT keyword', function () {
    const actual = scanToken(initState('INSERT'));
    const expected = {
      type: 'keyword',
      value: 'INSERT',
      start: 0,
      end: 5,
    };
    expect(actual).to.eql(expected);
  });

  it('scans DELETE keyword', function () {
    const actual = scanToken(initState('DELETE'));
    const expected = {
      type: 'keyword',
      value: 'DELETE',
      start: 0,
      end: 5,
    };
    expect(actual).to.eql(expected);
  });

  it('scans UPDATE keyword', function () {
    const actual = scanToken(initState('UPDATE'));
    const expected = {
      type: 'keyword',
      value: 'UPDATE',
      start: 0,
      end: 5,
    };
    expect(actual).to.eql(expected);
  });

  it('scans CREATE keyword', function () {
    const actual = scanToken(initState('CREATE'));
    const expected = {
      type: 'keyword',
      value: 'CREATE',
      start: 0,
      end: 5,
    };
    expect(actual).to.eql(expected);
  });

  it('scans DROP keyword', function () {
    const actual = scanToken(initState('DROP'));
    const expected = {
      type: 'keyword',
      value: 'DROP',
      start: 0,
      end: 3,
    };
    expect(actual).to.eql(expected);
  });

  it('scans TABLE keyword', function () {
    const actual = scanToken(initState('TABLE'));
    const expected = {
      type: 'keyword',
      value: 'TABLE',
      start: 0,
      end: 4,
    };
    expect(actual).to.eql(expected);
  });

  it('scans VIEW keyword', () => {
    const actual = scanToken(initState('VIEW'));
    const expected = {
      type: 'keyword',
      value: 'VIEW',
      start: 0,
      end: 3,
    };
    expect(actual).to.eql(expected);
  });

  it('scans DATABASE keyword', function () {
    const actual = scanToken(initState('DATABASE'));
    const expected = {
      type: 'keyword',
      value: 'DATABASE',
      start: 0,
      end: 7,
    };
    expect(actual).to.eql(expected);
  });

  it('scans TRUNCATE keyword', function () {
    const actual = scanToken(initState('TRUNCATE'));
    const expected = {
      type: 'keyword',
      value: 'TRUNCATE',
      start: 0,
      end: 7,
    };
    expect(actual).to.eql(expected);
  });

  it('scans \'Hello World\' as string value', function () {
    const actual = scanToken(initState('\'Hello World\''));
    const expected = {
      type: 'string',
      value: '\'Hello World\'',
      start: 0,
      end: 12,
    };
    expect(actual).to.eql(expected);
  });

  it('skips unknown tokens', function () {
    const actual = scanToken(initState('*'));
    const expected = {
      type: 'unknown',
      value: '*',
      start: 0,
      end: 0,
    };
    expect(actual).to.eql(expected);
  });

  it('scans ; individual identifier', function () {
    const actual = scanToken(initState(';'));
    const expected = {
      type: 'semicolon',
      value: ';',
      start: 0,
      end: 0,
    };
    expect(actual).to.eql(expected);
  });

  it('scans string with underscore as one token', function () {
    const actual = scanToken(initState('end_date'));
    const expected = {
      type: 'unknown',
      value: 'end_date',
      start: 0,
      end: 7,
    };
    expect(actual).to.eql(expected);
  });

  it('scans dollar quoted string', function () {
    const actual = scanToken(initState('$$test$$'));
    const expected = {
      type: 'string',
      value: '$$test$$',
      start: 0,
      end: 7,
    };
    expect(actual).to.eql(expected);
  });

  it('scans dollar quoted string with label', function () {
    const actual = scanToken(initState('$aaa$test$aaa$'));
    const expected = {
      type: 'string',
      value: '$aaa$test$aaa$',
      start: 0,
      end: 13,
    };
    expect(actual).to.eql(expected);
  });
});
