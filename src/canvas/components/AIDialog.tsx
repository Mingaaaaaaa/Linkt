import { generateText } from 'ai';
import React, { useState, useEffect } from 'react';
import { SYSTEM_PROMPT } from './prompt';
import { useCanvasStore } from '../../store';
import {
  getApiKey,
  setApiKey,
  AIProvider,
  getCurrentProvider,
  setCurrentProvider,
  getCurrentAIClient
} from './ai';
import { PreviewCanvas } from './PreviewCanvas';

interface AIDialogProps {
  open: boolean;
  onClose: () => void;
}

// 动态 AI 服务调用
const aiService = async (
  prompt: string
): Promise<{ summary: string; elements: any[] }> => {
  try {
    const model = getCurrentAIClient();
    if (!model) {
      throw new Error('未配置 API Key 或 AI 提供商不可用');
    }

    const { text, reasoning } = await generateText({
      model: model('deepseek-chat'), // 对于 OpenAI 可能需要不同的模型名称
      prompt: `${SYSTEM_PROMPT}\n\n用户需输入：${prompt}`
    });

    if (reasoning) {
      console.log('AI 推理过程:', reasoning);
    }

    const result = JSON.parse(text);

    if (!result.summary || !Array.isArray(result.elements)) {
      console.log('AI 返回的数据结构不正确:', result);
      throw new Error('AI 返回的数据结构不正确');
    }

    return result;
  } catch (err) {
    console.error('AI 服务错误:', err);
    throw new Error(
      `AI 服务错误: ${err instanceof Error ? err.message : '未知错误'}`
    );
  }
};

export const AIDialog: React.FC<AIDialogProps> = ({ open, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<{
    summary: string;
    elements: any[];
  } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    getCurrentProvider()
  );

  const addElement = useCanvasStore((state) => state.addElement);
  const setSelectedElementIds = useCanvasStore(
    (state) => state.setSelectedElementIds
  );
  const elements = useCanvasStore((state) => state.elements); // 获取当前画布上的所有元素

  useEffect(() => {
    setSelectedProvider(getCurrentProvider());
    const storedKey = getApiKey(selectedProvider) || '';
    setApiKeyInput(storedKey);
  }, [selectedProvider]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKeyInput(value);
  };

  const handleSaveApiKey = () => {
    setApiKey(selectedProvider, apiKeyInput);
    alert(`${selectedProvider} API 密钥已保存`);
  };

  const handleAiProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AIProvider;
    setSelectedProvider(newProvider);
    setCurrentProvider(newProvider);

    // 读取新提供商的 API 密钥
    const storedKey = getApiKey(newProvider) || '';
    setApiKeyInput(storedKey);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await aiService(prompt);
      setResponse(result);
    } catch (err) {
      console.error('处理 AI 响应时出错:', err);
      setError(
        err instanceof Error ? err.message : 'AI 服务暂时不可用，请稍后再试'
      );
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

    const selectedElementIds: Record<string, boolean> = {};

    // 计算所有新元素的边界框
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // 查找AI生成元素的边界
    response.elements.forEach((element) => {
      if (element.x < minX) minX = element.x;
      if (element.y < minY) minY = element.y;
      if (element.x + (element.width || 0) > maxX)
        maxX = element.x + (element.width || 0);
      if (element.y + (element.height || 0) > maxY)
        maxY = element.y + (element.height || 0);
    });

    // 计算整体宽度和高度
    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;

    // 检查画布上现有元素的位置，找到一个合适的插入位置
    const findSuitablePosition = () => {
      // 默认位置（可以是画布的中心或自定义起始位置）
      let posX = 100;
      let posY = 100;

      // 检查位置是否合适（不与现有元素重叠）
      const isPositionSuitable = (x: number, y: number) => {
        // 检查新插入组的边界框
        const newGroupBounds = {
          left: x,
          top: y,
          right: x + groupWidth,
          bottom: y + groupHeight
        };

        // 检查是否与现有元素重叠
        for (const element of elements) {
          const elementBounds = {
            left: element.x,
            top: element.y,
            right: element.x + (element.width || 0),
            bottom: element.y + (element.height || 0)
          };

          // 简单的矩形重叠检测
          if (
            !(
              newGroupBounds.right < elementBounds.left ||
              newGroupBounds.left > elementBounds.right ||
              newGroupBounds.bottom < elementBounds.top ||
              newGroupBounds.top > elementBounds.bottom
            )
          ) {
            return false; // 有重叠
          }
        }

        return true; // 没有重叠
      };

      // 网格搜索可用位置
      const gridSize = 100; // 搜索步长
      const maxAttempts = 20; // 最大尝试次数

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // 在画布上不同位置尝试
        for (
          let offsetY = 0;
          offsetY <= attempt * gridSize;
          offsetY += gridSize
        ) {
          for (
            let offsetX = 0;
            offsetX <= attempt * gridSize;
            offsetX += gridSize
          ) {
            // 尝试右下方向
            if (isPositionSuitable(posX + offsetX, posY + offsetY)) {
              return { x: posX + offsetX, y: posY + offsetY };
            }

            // 尝试左下方向
            if (
              offsetX > 0 &&
              isPositionSuitable(posX - offsetX, posY + offsetY)
            ) {
              return { x: posX - offsetX, y: posY + offsetY };
            }

            // 尝试右上方向
            if (
              offsetY > 0 &&
              isPositionSuitable(posX + offsetX, posY - offsetY)
            ) {
              return { x: posX + offsetX, y: posY - offsetY };
            }

            // 尝试左上方向
            if (
              offsetX > 0 &&
              offsetY > 0 &&
              isPositionSuitable(posX - offsetX, posY - offsetY)
            ) {
              return { x: posX - offsetX, y: posY - offsetY };
            }
          }
        }
      }

      // 如果实在找不到合适位置，返回默认位置或随机位置
      return { x: posX + Math.random() * 200, y: posY + Math.random() * 200 };
    };

    // 获取合适的位置
    const suitablePosition = findSuitablePosition();

    // 计算偏移量
    const offsetX = suitablePosition.x - minX;
    const offsetY = suitablePosition.y - minY;

    response.elements.forEach((element) => {
      // 生成随机ID，确保不会与现有元素冲突
      const randomId = `element-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // 复制元素，替换ID并调整位置
      const elementWithNewId = {
        ...element,
        id: randomId,
        x: element.x + offsetX,
        y: element.y + offsetY
      };

      addElement(elementWithNewId);
      selectedElementIds[randomId] = true;
    });

    setSelectedElementIds(selectedElementIds);
    onClose();
  };

  // 处理回车键触发生成
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 检查是否按下了回车键且没有按下Shift键（避免影响换行）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 防止添加换行符
      if (!isLoading && prompt.trim()) {
        handleSubmit();
      }
    }
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
          maxWidth: '800px',
          maxHeight: '90vh',
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
            <div
              style={{
                display: 'flex',
                gap: '32px',
                justifyContent: 'start'
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <label
                  style={{
                    alignSelf: 'center',
                    fontSize: '14px',
                    width: 'max-content'
                  }}
                >
                  AI 提供商:
                </label>
                <select
                  value={selectedProvider}
                  onChange={handleAiProviderChange}
                  style={{
                    minWidth: '150px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value='deepseek'>DeepSeek</option>
                  <option value='openai'>OpenAI</option>
                  <option value='anthropic'>Anthropic</option>
                </select>
              </div>

              <div style={{ display: 'flex' }}>
                <span style={{ fontSize: '14px' }}>API Key:</span>
                <div style={{ display: 'flex', gap: '8px', width: '95%' }}>
                  <input
                    type='password'
                    value={apiKeyInput}
                    onChange={handleApiKeyChange}
                    placeholder={`请输入 ${selectedProvider} API Key`}
                    style={{
                      minWidth: '250px',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
              <button
                onClick={handleSaveApiKey}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                保存
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setPrompt(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder='请输入您的需求... (按回车键生成)'
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
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}
                >
                  {response.summary}
                </div>

                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '8px',
                      color: '#555'
                    }}
                  >
                    预览效果:
                  </div>
                  <PreviewCanvas
                    elements={response.elements}
                    width={700}
                    height={350}
                  />
                </div>

                <details style={{ marginTop: '8px' }}>
                  <summary
                    style={{
                      cursor: 'pointer',
                      color: '#666',
                      fontSize: '13px',
                      padding: '4px',
                      userSelect: 'none'
                    }}
                  >
                    查看原始数据
                  </summary>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      fontSize: '12px',
                      maxHeight: '200px',
                      overflow: 'auto',
                      marginTop: '8px'
                    }}
                  >
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(response.elements, null, 2)}
                    </pre>
                  </div>
                </details>
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
