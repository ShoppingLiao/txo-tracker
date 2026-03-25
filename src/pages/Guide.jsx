import ReactMarkdown from 'react-markdown'
import rehypeSlug from 'rehype-slug'
import guideContent from '../../docs/ai-import-guide.md?raw'
import './Guide.css'

export default function Guide() {
  return (
    <div className="guide">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI 輔助匯入指南</h1>
          <p className="page-subtitle">Import Guide</p>
        </div>
      </div>

      <div className="guide-body">
        <ReactMarkdown rehypePlugins={[rehypeSlug]}>{guideContent}</ReactMarkdown>
      </div>
    </div>
  )
}
