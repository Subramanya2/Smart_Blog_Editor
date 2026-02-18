import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import useAutoSave from '../hooks/useAutoSave';

// Theme configuration
const theme = {
  paragraph: 'mb-2',
  text: { bold: 'font-bold', italic: 'italic' },
};

// Wrapper for hook usage inside Context
function AutoSaveWrapper({ postId }) {
  const isSaving = useAutoSave(postId);
  return <div className="text-xs text-gray-500 absolute top-2 right-2">{isSaving ? 'Saving...' : 'Saved'}</div>;
}

export default function Editor({ postId, initialContent }) {
  const initialConfig = {
    namespace: 'MyEditor',
    theme,
    onError: (e) => console.error(e),
    editorState: (initialContent && Object.keys(initialContent).length > 0)
      ? JSON.stringify(initialContent)
      : null
  };

  return (
    <div className="relative border rounded-lg p-4 shadow-sm bg-white min-h-[300px]">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={<ContentEditable className="outline-none min-h-[200px]" />}
          placeholder={<div className="absolute top-4 text-gray-400">Start writing...</div>}
          ErrorBoundary={(e) => <div>Error</div>}
        />
        <HistoryPlugin />
        {postId && <AutoSaveWrapper postId={postId} />}
      </LexicalComposer>
    </div>
  );
}