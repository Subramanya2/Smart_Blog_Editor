import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $createParagraphNode,
  $isRootOrShadowRoot,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { $getNearestNodeOfType, $findMatchingParent } from '@lexical/utils';
import { $setBlocksType } from '@lexical/selection';

const BLOCK_TYPES = {
  paragraph: 'Normal',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  bullet: 'Bullet List',
  number: 'Numbered List',
  quote: 'Quote',
};

function ToolbarButton({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded text-sm font-medium transition-all
        ${active
          ? 'bg-purple-100 text-purple-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [wordCount, setWordCount] = useState(0);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Block type detection
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType(anchorNode, ListNode);
        const type = parentList ? parentList.getListType() : element.getListType();
        setBlockType(type === 'bullet' ? 'bullet' : 'number');
      } else if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else {
        setBlockType(element.getType() || 'paragraph');
      }
    }

    // Word count
    editor.getEditorState().read(() => {
      const root = editor.getEditorState()._nodeMap;
      let text = '';
      root.forEach((node) => {
        if (node.getType && node.getType() === 'text') {
          text += node.getTextContent() + ' ';
        }
      });
      const words = text.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatHeading = (tag) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (blockType === tag) {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createHeadingNode(tag));
        }
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (blockType === 'quote') {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      }
    });
  };

  const toggleBulletList = () => {
    if (blockType === 'bullet') {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  };

  const toggleNumberedList = () => {
    if (blockType === 'number') {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 bg-white border-b border-gray-100 flex-wrap">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        active={isBold}
        title="Bold (Ctrl+B)"
      >
        <span className="font-bold w-5 h-5 inline-flex items-center justify-center">B</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        active={isItalic}
        title="Italic (Ctrl+I)"
      >
        <span className="italic w-5 h-5 inline-flex items-center justify-center">I</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        active={isUnderline}
        title="Underline (Ctrl+U)"
      >
        <span className="underline w-5 h-5 inline-flex items-center justify-center">U</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        active={isStrikethrough}
        title="Strikethrough"
      >
        <span className="line-through w-5 h-5 inline-flex items-center justify-center">S</span>
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => formatHeading('h1')}
        active={blockType === 'h1'}
        title="Heading 1"
      >
        <span className="w-5 h-5 inline-flex items-center justify-center text-xs font-bold">H1</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => formatHeading('h2')}
        active={blockType === 'h2'}
        title="Heading 2"
      >
        <span className="w-5 h-5 inline-flex items-center justify-center text-xs font-bold">H2</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => formatHeading('h3')}
        active={blockType === 'h3'}
        title="Heading 3"
      >
        <span className="w-5 h-5 inline-flex items-center justify-center text-xs font-bold">H3</span>
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={toggleBulletList}
        active={blockType === 'bullet'}
        title="Bullet List"
      >
        {/* Bullet list icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={toggleNumberedList}
        active={blockType === 'number'}
        title="Numbered List"
      >
        {/* Numbered list icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
          <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">1.</text>
          <text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">2.</text>
          <text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">3.</text>
        </svg>
      </ToolbarButton>

      <ToolbarButton
        onClick={formatQuote}
        active={blockType === 'quote'}
        title="Block Quote"
      >
        {/* Quote icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      </ToolbarButton>

      {/* Word count — pushed to right */}
      <div className="ml-auto text-xs text-gray-400 select-none pr-1">
        {wordCount} word{wordCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
