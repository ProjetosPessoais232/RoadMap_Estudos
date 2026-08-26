const KEYWORDS = {
  python: 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield',
  java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield true false null',
  javascript: 'async await break case catch class const continue debugger default delete do else export extends false finally for from function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while with yield',
  typescript: 'async await break case catch class const continue debugger default delete do else export extends false finally for from function if import in instanceof interface let new null of return static super switch this throw true try type typeof undefined var void while with yield as keyof readonly',
  sql: 'add all alter and as asc between by case create delete desc distinct drop else exists from group having in insert into is join key left like limit not null on or order outer primary right select set table then union update values when where',
  css: 'important and not only or',
  html: '',
  bash: 'alias break case cd continue do done echo elif else esac exit export fi for function if in return then until while',
  go: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil',
  rust: 'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while',
}

KEYWORDS.js = KEYWORDS.javascript
KEYWORDS.ts = KEYWORDS.typescript
KEYWORDS.py = KEYWORDS.python
KEYWORDS.sh = KEYWORDS.bash
KEYWORDS.jsx = KEYWORDS.javascript
KEYWORDS.tsx = KEYWORDS.typescript

function keywordSet(language) {
  const list = KEYWORDS[String(language || '').toLowerCase()]
  return new Set((list || KEYWORDS.javascript).split(/\s+/).filter(Boolean))
}

function push(tokens, type, value) {
  if (!value) return
  const last = tokens[tokens.length - 1]
  if (last && last.type === type) last.value += value
  else tokens.push({ type, value })
}

export function highlightCode(code, language) {
  const keywords = keywordSet(language)
  const tokens = []
  let i = 0
  const source = code || ''
  const lang = String(language || '').toLowerCase()
  const hashComment = lang === 'python' || lang === 'py' || lang === 'bash' || lang === 'sh' || lang === 'sql'
  const lineComment = lang === 'html' || lang === 'css' ? null : '//'

  while (i < source.length) {
    const rest = source.slice(i)
    const two = source.slice(i, i + 2)

    if (hashComment && source[i] === '#') {
      const end = source.indexOf('\n', i)
      const cut = end === -1 ? source.length : end
      push(tokens, 'com', source.slice(i, cut))
      i = cut
      continue
    }
    if (two === '/*') {
      const end = source.indexOf('*/', i + 2)
      const cut = end === -1 ? source.length : end + 2
      push(tokens, 'com', source.slice(i, cut))
      i = cut
      continue
    }
    if (lineComment && two === lineComment) {
      const end = source.indexOf('\n', i)
      const cut = end === -1 ? source.length : end
      push(tokens, 'com', source.slice(i, cut))
      i = cut
      continue
    }
    if (rest.startsWith('<!--')) {
      const end = source.indexOf('-->', i + 4)
      const cut = end === -1 ? source.length : end + 3
      push(tokens, 'com', source.slice(i, cut))
      i = cut
      continue
    }

    const quote = source[i]
    if (quote === '"' || quote === "'" || quote === '`') {
      let j = i + 1
      while (j < source.length) {
        if (source[j] === '\\') {
          j += 2
          continue
        }
        if (source[j] === quote) {
          j += 1
          break
        }
        j += 1
      }
      push(tokens, 'str', source.slice(i, j))
      i = j
      continue
    }

    if (/[0-9]/.test(source[i])) {
      const match = rest.match(/^\d[\d_]*(?:\.[\d_]+)?/)
      push(tokens, 'num', match[0])
      i += match[0].length
      continue
    }

    if (/[A-Za-z_\u00C0-\u024F]/.test(source[i])) {
      const match = rest.match(/^[A-Za-z_\u00C0-\u024F][\w\u00C0-\u024F]*/)
      const word = match[0]
      const after = source.slice(i + word.length).match(/^\s*\(/)
      if (keywords.has(word)) push(tokens, 'kw', word)
      else if (after) push(tokens, 'fn', word)
      else if (/^[A-Z]/.test(word)) push(tokens, 'type', word)
      else push(tokens, 'id', word)
      i += word.length
      continue
    }

    if (/[(){}\[\],.;:?<>+\-*/%=!&|^~]/.test(source[i])) {
      push(tokens, 'op', source[i])
      i += 1
      continue
    }

    push(tokens, 'plain', source[i])
    i += 1
  }

  return tokens
}
