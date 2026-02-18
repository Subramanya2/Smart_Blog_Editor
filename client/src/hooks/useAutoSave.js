import { useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import axios from 'axios';
import useStore from '../store';

export default function useAutoSave(postId) {
    const [editor] = useLexicalComposerContext();
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef(null);
    const token = useStore((state) => state.token);

    useEffect(() => {
        if (!postId || !token) return;

        const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            setIsSaving(true);

            timeoutRef.current = setTimeout(async () => {
                const jsonState = editorState.toJSON();
                try {
                    await axios.patch(
                        `http://127.0.0.1:8000/api/posts/${postId}`,
                        { content: jsonState },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    console.log("Auto-saved!");
                    setIsSaving(false);
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
    }, [editor, postId, token]);

    return isSaving;
}
