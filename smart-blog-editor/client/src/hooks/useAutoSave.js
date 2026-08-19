import { useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import api from '../services/api';
import useStore from '../store';

export default function useAutoSave(postId, onSaveSuccess) {
    const [editor] = useLexicalComposerContext();
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef(null);
    const token = useStore((state) => state.token);

    useEffect(() => {
        if (!postId || !token) return;

        const doSave = async (editorState, immediate = false) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setIsSaving(true);

            const delay = immediate ? 0 : 2000;

            timeoutRef.current = setTimeout(async () => {
                const jsonState = editorState.toJSON();
                try {
                    await api.patch(
                        `/api/posts/${postId}`,
                        { content: jsonState }
                    );
                    console.log('Auto-saved!');
                    setIsSaving(false);
                    if (onSaveSuccess) {
                        onSaveSuccess(jsonState);
                    }
                } catch (error) {
                    console.error('Save failed', error);
                    setIsSaving(false);
                }
            }, delay);
        };

        const removeUpdateListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
            // Ignore no-op updates (selection only) or pure CRDT/undo/ghost updates
            if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
            if (tags.has('collaboration') || tags.has('historic') || tags.has('skip-collab')) return;

            // Tab acceptance: save immediately (no 2s debounce) since it's a deliberate commit
            if (tags.has('accept-ghost')) {
                doSave(editorState, true);
                return;
            }

            // Regular typing: debounce 2s
            doSave(editorState, false);
        });

        return () => {
            removeUpdateListener();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [editor, postId, token, onSaveSuccess]);

    return isSaving;
}
