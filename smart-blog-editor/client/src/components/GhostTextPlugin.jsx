import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_TAB_COMMAND,
  KEY_DOWN_COMMAND
} from 'lexical';
import { $createGhostTextNode, $isGhostTextNode } from '../nodes/GhostTextNode';
import { streamAutocomplete } from '../services/aiService';

export default function GhostTextPlugin() {
  const [editor] = useLexicalComposerContext();
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  // Set to true after Tab acceptance so the replacement update doesn't re-trigger autocomplete
  const justAcceptedRef = useRef(false);

  // Helper to clear existing ghost node from editor
  const clearGhostNode = () => {
    editor.update(() => {
      const root = $getRoot();
      root.getChildren().forEach((child) => {
        if (child.getChildren) {
          child.getChildren().forEach((node) => {
            if ($isGhostTextNode(node)) {
              node.remove();
            }
          });
        }
      });
    }, { tag: 'skip-collab' });
  };

  // Helper to abort active stream
  const abortStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    // Command listener for TAB key to accept ghost text
    const unregisterTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        let accepted = false;
        editor.update(() => {
          const root = $getRoot();
          root.getChildren().forEach((child) => {
            if (child.getChildren) {
              child.getChildren().forEach((node) => {
                if ($isGhostTextNode(node)) {
                  const text = node.getTextContent();
                  if (text) {
                    const regularNode = $createTextNode(text);
                    node.replace(regularNode);
                    accepted = true;
                  } else {
                    node.remove();
                  }
                }
              });
            }
          });
        });

        if (accepted) {
          event.preventDefault();
          abortStream();
          // Clear any pending debounce from before acceptance
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          // Flag so the dirty-leaves update from the replacement is skipped
          justAcceptedRef.current = true;
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Command listener for keydown to cancel ghost text on typing
    const unregisterKeyDown = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        if (event.key !== 'Tab') {
          abortStream();
          clearGhostNode();
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Editor update listener for debouncing stream requests
    const unregisterUpdate = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
      // Skip updates caused by ghost text insert/remove (skip-collab tag) or CRDT/undo
      if (tags.has('skip-collab') || tags.has('collaboration') || tags.has('historic')) {
        return;
      }

      // Skip pure selection / cursor moves — only react to actual content edits
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
        return;
      }

      // Skip the dirty-leaves update caused by Tab acceptance (ghost→regular node replacement)
      // Reset the flag so the NEXT real keystroke works normally
      if (justAcceptedRef.current) {
        justAcceptedRef.current = false;
        return;
      }

      // User typed something new — abort any running stream and clear stale ghost text
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      abortStream();
      clearGhostNode();

      debounceTimerRef.current = setTimeout(async () => {
        let currentText = '';
        editorState.read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchor = selection.anchor;
            const node = anchor.getNode();
            currentText = node.getTextContent().substring(0, anchor.offset);
          } else {
            currentText = $getRoot().getTextContent();
          }
        });

        if (!currentText.trim()) return;

        abortStream();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
          await streamAutocomplete(currentText, abortController.signal, (accumulatedGhostText) => {
            editor.update(() => {
              let foundGhost = false;
              const root = $getRoot();
              root.getChildren().forEach((child) => {
                if (child.getChildren) {
                  child.getChildren().forEach((node) => {
                    if ($isGhostTextNode(node)) {
                      node.setTextContent(accumulatedGhostText);
                      foundGhost = true;
                    }
                  });
                }
              });

              if (!foundGhost) {
                const root = $getRoot();
                const lastChild = root.getLastChild();
                const ghostNode = $createGhostTextNode(accumulatedGhostText);
                if (lastChild && typeof lastChild.append === 'function') {
                  lastChild.append(ghostNode);
                } else {
                  root.append(ghostNode);
                }
              }
            }, { tag: 'skip-collab' });
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Ghost text streaming error:', err);
          }
        }
      }, 1200);
    });

    return () => {
      unregisterTab();
      unregisterKeyDown();
      unregisterUpdate();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      abortStream();
    };
  }, [editor]);

  return null;
}
