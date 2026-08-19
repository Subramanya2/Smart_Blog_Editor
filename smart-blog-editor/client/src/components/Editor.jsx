import { useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import useAutoSave from '../hooks/useAutoSave';
import { GhostTextNode } from '../nodes/GhostTextNode';
import GhostTextPlugin from './GhostTextPlugin';
import ToolbarPlugin from './ToolbarPlugin';
import { createYjsProvider } from '../services/websocketService';

// Theme: maps Lexical node types to Tailwind classes
const theme = {
  paragraph: 'mb-2 leading-7',
  heading: {
    h1: 'text-3xl font-bold mb-3 mt-5 text-gray-900',
    h2: 'text-2xl font-bold mb-2 mt-4 text-gray-800',
    h3: 'text-xl font-semibold mb-2 mt-3 text-gray-700',
  },
  list: {
    ul: 'list-disc ml-6 mb-2 space-y-1',
    ol: 'list-decimal ml-6 mb-2 space-y-1',
    listitem: 'mb-0.5',
  },
  quote: 'border-l-4 border-purple-300 pl-4 italic text-gray-500 my-3',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    underlineStrikethrough: 'underline line-through',
  },
};

// Wrapper: uses hook inside the Lexical composer context
function AutoSaveWrapper({ postId, onUpdateContent }) {
  const isSaving = useAutoSave(postId, (content) => {
    if (onUpdateContent) onUpdateContent(postId, content);
  });

  return (
    <div className="flex items-center gap-1.5 text-xs absolute top-3 right-3 select-none">
      {isSaving ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-600">Saving…</span>
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-600">Saved</span>
        </>
      )}
    </div>
  );
}

export default function Editor({ postId, initialContent, onUpdateContent }) {
  const hasContent = initialContent && (
    (typeof initialContent === 'object' && Object.keys(initialContent).length > 0) ||
    (typeof initialContent === 'string' && initialContent.trim().length > 0)
  );

  const initialEditorState = hasContent
    ? (typeof initialContent === 'string' ? initialContent : JSON.stringify(initialContent))
    : null;

  const initialConfig = {
    namespace: 'SmartBlogEditor',
    nodes: [
      GhostTextNode,
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
    ],
    theme,
    onError: (e) => console.error(e),
    editorState: null,
  };

  const providerFactory = useCallback(
    (id, yjsDocMap) => createYjsProvider(id, yjsDocMap),
    []
  );

  return (
    <div className="relative border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
      <LexicalCollaboration>
        <LexicalComposer key={postId} initialConfig={initialConfig}>

          {/* ── Formatting Toolbar ── */}
          <ToolbarPlugin />

          {/* ── Editor surface ── */}
          <div className="relative px-6 py-5 min-h-[380px]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="outline-none min-h-[340px] prose prose-gray max-w-none text-gray-800 leading-7"
                />
              }
              placeholder={
                <div className="absolute top-5 left-6 text-gray-300 pointer-events-none select-none">
                  Start writing… (stop typing for AI suggestions)
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />

            {postId && (
              <AutoSaveWrapper postId={postId} onUpdateContent={onUpdateContent} />
            )}
          </div>

          {/* ── Lexical Plugins ── */}
          <ListPlugin />
          <GhostTextPlugin />

          {postId && (
            <CollaborationPlugin
              id={postId}
              providerFactory={providerFactory}
              shouldBootstrap={true}
              initialEditorState={initialEditorState}
            />
          )}

        </LexicalComposer>
      </LexicalCollaboration>
    </div>
  );
}