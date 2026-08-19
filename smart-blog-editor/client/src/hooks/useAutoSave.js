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

        const removeUpdateListener = editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
            // Ignore updates triggered by initial mount, collaboration sync, undo/redo, or ghost text
            if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
                return;
            }
            if (tags.has('collaboration') || tags.has('historic') || tags.has('skip-collab')) {
                return;
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            setIsSaving(true);

            timeoutRef.current = setTimeout(async () => {
                const jsonState = editorState.toJSON();
                try {
                    await api.patch(
                        `/api/posts/${postId}`,
                        { content: jsonState }
                    );
                    console.log("Auto-saved!");
                    setIsSaving(false);
                    if (onSaveSuccess) {
                        onSaveSuccess(jsonState);
                    }
                } catch (error) {
                    console.error("Save failed", error);
                    setIsSaving(false);
                }
            }, 2000); // 2s debounce
        });

        return () => {
            removeUpdateListener();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [editor, postId, token, onSaveSuccess]);

    return isSaving;
}
