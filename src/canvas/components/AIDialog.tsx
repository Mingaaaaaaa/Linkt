import React, { useState } from 'react';
import { useCanvasStore } from '../../store';

interface AIDialogProps {
  open: boolean;
  onClose: () => void;
}

// 模拟 AI 服务
const mockAIService = async (
  prompt: string
): Promise<{ summary: string; elements: any[] }> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 模拟返回的数据
  return {
    summary:
      '分析：前端性能优化主要分为加载优化、渲染优化和资源优化三大类。图中将这三类分别用矩形标示，并通过箭头表示逻辑流向。同时，添加一个使用 freeDraw 元素绘制的小人作为装饰，增强图形的趣味性。',
    elements: [
      {
        id: 'rect1',
        type: 'rectangle',
        x: 100,
        y: 50,
        width: 150,
        height: 60,
        strokeColor: '#000000',
        backgroundColor: '#d0f0fd',
        strokeWidth: 1,
        roughness: 1,
        seed: 1
      },
      {
        id: 'text1',
        type: 'text',
        x: 120,
        y: 70,
        width: 110,
        height: 20,
        strokeColor: '#000000',
        text: '加载优化',
        seed: 2
      },
      {
        id: 'rect2',
        type: 'rectangle',
        x: 100,
        y: 150,
        width: 150,
        height: 60,
        strokeColor: '#000000',
        backgroundColor: '#d0f0fd',
        strokeWidth: 1,
        roughness: 1,
        seed: 3
      },
      {
        id: 'text2',
        type: 'text',
        x: 120,
        y: 170,
        width: 110,
        height: 20,
        strokeColor: '#000000',
        text: '渲染优化',
        seed: 4
      },
      {
        id: 'rect3',
        type: 'rectangle',
        x: 100,
        y: 250,
        width: 150,
        height: 60,
        strokeColor: '#000000',
        backgroundColor: '#d0f0fd',
        strokeWidth: 1,
        roughness: 1,
        seed: 5
      },
      {
        id: 'text3',
        type: 'text',
        x: 120,
        y: 270,
        width: 110,
        height: 20,
        strokeColor: '#000000',
        text: '资源优化',
        seed: 6
      },
      {
        id: 'arrow1',
        type: 'arrow',
        x: 150,
        y: 110,
        width: 0,
        height: 40,
        strokeColor: '#000000',
        strokeWidth: 1,
        roughness: 1,
        seed: 7,
        startArrowhead: null,
        endArrowhead: 'arrow'
      },
      {
        id: 'arrow2',
        type: 'arrow',
        x: 150,
        y: 210,
        width: 0,
        height: 40,
        strokeColor: '#000000',
        strokeWidth: 1,
        roughness: 1,
        seed: 8,
        startArrowhead: null,
        endArrowhead: 'arrow'
      },
      {
        id: 'freedraw_littleman',
        type: 'freeDraw',
        x: 300,
        y: 200,
        width: 40,
        height: 80,
        strokeColor: '#000000',
        strokeWidth: 2,
        roughness: 1,
        seed: 9,
        simulatePressure: false,
        points: [
          [20, 0],
          [25, 5],
          [30, 10],
          [25, 15],
          [20, 10],
          [15, 15],
          [10, 10],
          [15, 5],
          [20, 0], // 头部
          [20, 10],
          [20, 30], // 躯干
          [20, 15],
          [10, 25], // 左手
          [20, 15],
          [30, 25], // 右手
          [20, 30],
          [10, 45], // 左腿
          [20, 30],
          [30, 45] // 右腿
        ]
      }
    ]
  };
};

export const AIDialog: React.FC<AIDialogProps> = ({ open, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<{
    summary: string;
    elements: any[];
  } | null>(null);
  const addElement = useCanvasStore((state) => state.addElement);
  const setSelectedElementIds = useCanvasStore(
    (state) => state.setSelectedElementIds
  );

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await mockAIService(prompt);
      setResponse(result);
    } catch (err) {
      setError('AI 服务暂时不可用，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPrompt('');
    setResponse(null);
    setError(null);
    onClose();
  };

  const handleInsert = () => {
    if (!response?.elements) return;

    // 创建选中元素的 ID 映射
    const selectedElementIds: Record<string, boolean> = {};

    response.elements.forEach((element) => {
      addElement(element);
      selectedElementIds[element.id] = true;
    });

    // 设置选中状态
    setSelectedElementIds(selectedElementIds);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e0e0e0',
            fontSize: '1.25rem',
            fontWeight: 500
          }}
        >
          AI 助手
        </div>

        <div
          style={{
            padding: '24px',
            flex: 1,
            overflow: 'auto'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%'
            }}
          >
            <textarea
              value={prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setPrompt(e.target.value)
              }
              placeholder='请输入您的需求...'
              disabled={isLoading}
              style={{
                width: '95%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #3498db',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              </div>
            )}

            {error && (
              <div style={{ color: '#e74c3c', fontSize: '14px' }}>{error}</div>
            )}

            {response && (
              <>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '14px',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                >
                  {response.summary}
                </div>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '14px',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {JSON.stringify(response.elements, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px'
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !prompt.trim() ? 0.6 : 1,
              fontSize: '14px'
            }}
          >
            生成
          </button>
          <button
            onClick={handleInsert}
            disabled={isLoading || !response}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !response ? 'not-allowed' : 'pointer',
              opacity: isLoading || !response ? 0.6 : 1,
              fontSize: '14px'
            }}
          >
            插入到画板
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};
