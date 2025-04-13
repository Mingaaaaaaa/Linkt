import { createOpenAI } from '@ai-sdk/openai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createAnthropic } from '@ai-sdk/anthropic';

// API 密钥存储键名
const API_KEY_STORAGE_PREFIX = 'linkt_ai_api_key_';

// 可用的 AI 提供商列表
export type AIProvider = 'deepseek' | 'openai' | 'anthropic';

// 默认的 AI 提供商
export const DEFAULT_PROVIDER: AIProvider = 'deepseek';

// 获取存储的 API 密钥
export const getApiKey = (provider: AIProvider): string | null => {
    return localStorage.getItem(`${API_KEY_STORAGE_PREFIX}${provider}`);
};

// 设置 API 密钥到 localStorage
export const setApiKey = (provider: AIProvider, apiKey: string): void => {
    localStorage.setItem(`${API_KEY_STORAGE_PREFIX}${provider}`, apiKey);
};

// 获取当前选择的 AI 提供商
export const getCurrentProvider = (): AIProvider => {
    return (localStorage.getItem('linkt_current_ai_provider') as AIProvider) || DEFAULT_PROVIDER;
};

// 设置当前选择的 AI 提供商
export const setCurrentProvider = (provider: AIProvider): void => {
    localStorage.setItem('linkt_current_ai_provider', provider);
};

// 创建 Deepseek 实例
export const createDeepseekClient = () => {
    const apiKey = getApiKey('deepseek') || undefined;
    return createDeepSeek({
        apiKey,
        baseURL: 'https://api.deepseek.com/v1',
    });
};

// 创建 OpenAI 实例
export const createOpenAIClient = () => {
    const apiKey = getApiKey('openai');
    if (!apiKey) return null;

    return createOpenAI({
        apiKey,
    });
};

// 创建 Anthropic 实例
export const createAnthropicClient = () => {
    const apiKey = getApiKey('anthropic');
    if (!apiKey) return null;

    return createAnthropic({
        apiKey,
    });
};

// 获取当前选择的 AI 客户端实例
export const getCurrentAIClient = () => {
    const provider = getCurrentProvider();

    switch (provider) {
        case 'deepseek':
            return createDeepseekClient();
        case 'openai':
            return createOpenAIClient();
        case 'anthropic':
            return createAnthropicClient();
        default:
            return createDeepseekClient(); // 默认使用 deepseek
    }
};