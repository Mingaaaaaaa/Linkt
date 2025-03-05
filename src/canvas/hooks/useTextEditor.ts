import { useState } from "react";
import { ExcalidrawTextElement } from "../types";
import { TextEditingInfo } from "../types/interactionTypes";

export const useTextEditor = (
    updateElement: (id: string, props: Partial<ExcalidrawTextElement>) => void,
    forceRender: () => void
) => {
    const [editingText, setEditingText] = useState<TextEditingInfo | null>(null);

    const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (editingText) {
            setEditingText({
                ...editingText,
                inputValue: e.target.value
            });
        }
    };

    const handleTextInputBlur = () => {
        if (editingText) {
            // 更新文本元素
            updateElement(editingText.element.id, {
                text: editingText.inputValue
            } as Partial<ExcalidrawTextElement>);

            // 结束文本编辑
            setEditingText(null);

            // 手动触发渲染
            forceRender();
        }
    };

    const handleTextInputKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTextInputBlur();
        }
    };

    return {
        editingText,
        setEditingText,
        handleTextInputChange,
        handleTextInputBlur,
        handleTextInputKeyDown
    };
};
