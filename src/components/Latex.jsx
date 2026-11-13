import katex from 'katex'
import 'katex/dist/katex.min.css'

export function Latex({ math, block = false }) {
  const html = katex.renderToString(math, {
    displayMode: block,
    throwOnError: false,
  })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
