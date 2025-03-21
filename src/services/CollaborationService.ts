import { io, Socket } from "socket.io-client";
import { ExcalidrawElement } from "../canvas/types";
import { AppState } from "../canvas/types";
// 协作事件类型
export enum CollaborationEvent {
    CONNECT = "connect",
    UPGRADE = "upgrade",
    DISCONNECT = "disconnect",
    JOIN_ROOM = "join_room",
    LEAVE_ROOM = "leave_room",
    SYNC_SCENE = "sync_scene",
    UPDATE_ELEMENT = "update_element",
    ADD_ELEMENT = "add_element",
    DELETE_ELEMENT = "delete_element",
    CURSOR_POSITION = "cursor_position",
    USER_JOINED = "user_joined",
    USER_LEFT = "user_left",
    ERROR = "error",
    USER_JOIN = "user_join",
    USER_LEAVE = "user_leave",
    ROOM_STATUS_UPDATE = "room_status_update" // 添加房间状态更新事件
}

// 协作会话信息
export interface CollaborationSession {
    roomId: string;
    userId: string;
    username: string;
    connectedUsers: CollaborationUser[];
    isConnected: boolean;
}

// 协作用户信息
export interface CollaborationUser {
    id: string;
    username: string;
    color: string;
    cursor?: {
        x: number;
        y: number;
    };
}

// 元素更新消息
interface ElementUpdateMessage {
    userId: string;
    elementId: string;
    updates: Partial<ExcalidrawElement>;
}

// 元素添加消息
interface ElementAddMessage {
    userId: string;
    element: ExcalidrawElement;
}

// 元素删除消息
interface ElementDeleteMessage {
    userId: string;
    elementId: string;
}

// 场景同步消息
interface SceneSyncMessage {
    userId: string;
    elements: ExcalidrawElement[];
    appState: Partial<AppState>;
}

// 光标位置消息
interface CursorPositionMessage {
    userId: string;
    x: number;
    y: number;
}

export class CollaborationService {
    private socket: Socket | null = null;
    private session: CollaborationSession | null = null;
    private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private heartbeatInterval: any = null;
    // 初始化协作服务
    public init(serverUrl: string = window.location.origin): void {
        try {
            if (this.socket) {
                this.disconnect();
            }

            this.socket = io(serverUrl, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: this.maxReconnectAttempts,
                transportOptions: {
                    webtransport: {
                        hostname: serverUrl.includes('localhost') ? '127.0.0.1' : window.location.hostname
                    }
                }
            });

            // 设置基本事件监听
            this.socket.on(CollaborationEvent.CONNECT, () => {
                console.log("Connected to collaboration server");
                this.reconnectAttempts = 0;
                this.socket.io.engine.on("upgrade", (transport) => {
                    console.log(`transport upgraded to ${transport.name}`);
                    this.emit(CollaborationEvent.UPGRADE);
                });
                this.emit(CollaborationEvent.CONNECT);
            });

            this.socket.on(CollaborationEvent.DISCONNECT, (reason) => {
                console.log(`Disconnected from collaboration server: ${reason}`);
                if (this.session) {
                    this.session.isConnected = false;
                }
                this.emit(CollaborationEvent.DISCONNECT, reason);
            });

            this.socket.on("connect_error", (error) => {
                console.error("Connection error:", error);
                this.reconnectAttempts++;

                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    this.emit(CollaborationEvent.ERROR, {
                        message: "达到最大重连次数，无法连接到协作服务器"
                    });
                }
            });

            // 设置协作事件监听
            this.socket.on(CollaborationEvent.USER_JOINED, (data) => {
                if (this.session) {
                    // 更新当前用户列表
                    if (data.allUsers) {
                        this.session.connectedUsers = data.allUsers;
                    } else {
                        // 兼容旧版本
                        if (data.user && !this.session.connectedUsers.find(u => u.id === data.user.id)) {
                            this.session.connectedUsers.push(data.user);
                        }
                    }

                    // 触发UI更新
                    this.emit(CollaborationEvent.USER_JOINED, data.user);
                }
            });

            this.socket.on(CollaborationEvent.USER_LEFT, (userId: string) => {
                if (this.session) {
                    this.session.connectedUsers = this.session.connectedUsers.filter(
                        user => user.id !== userId
                    );
                    this.emit(CollaborationEvent.USER_LEFT, userId);
                }
            });

            this.socket.on(CollaborationEvent.SYNC_SCENE, (message: SceneSyncMessage) => {
                this.emit(CollaborationEvent.SYNC_SCENE, message);
            });

            this.socket.on(CollaborationEvent.UPDATE_ELEMENT, (message: ElementUpdateMessage) => {
                this.emit(CollaborationEvent.UPDATE_ELEMENT, message);
            });

            this.socket.on(CollaborationEvent.ADD_ELEMENT, (message: ElementAddMessage) => {
                this.emit(CollaborationEvent.ADD_ELEMENT, message);
            });

            this.socket.on(CollaborationEvent.DELETE_ELEMENT, (message: ElementDeleteMessage) => {
                this.emit(CollaborationEvent.DELETE_ELEMENT, message);
            });

            this.socket.on(CollaborationEvent.CURSOR_POSITION, (message: CursorPositionMessage) => {
                if (this.session) {
                    const user = this.session.connectedUsers.find(u => u.id === message.userId);
                    if (user) {
                        user.cursor = { x: message.x, y: message.y };
                        this.emit(CollaborationEvent.CURSOR_POSITION, message);
                    }
                }
            });

            // 添加房间状态更新事件监听
            this.socket.on(CollaborationEvent.ROOM_STATUS_UPDATE, (data: { roomId: string, users: CollaborationUser[] }) => {
                if (this.session && this.session.roomId === data.roomId) {
                    console.log("收到房间状态更新:", data);
                    // 更新当前会话中的用户列表
                    this.session.connectedUsers = data.users;

                    // 触发房间状态更新事件
                    this.emit(CollaborationEvent.ROOM_STATUS_UPDATE, {
                        roomId: data.roomId,
                        users: data.users
                    });
                }
            });

        } catch (error) {
            console.error("Failed to initialize collaboration service", error);
            this.emit(CollaborationEvent.ERROR, {
                message: "初始化协作服务失败"
            });
        }
    }

    // 连接到协作房间
    public joinRoom(roomId: string, username: string): void {
        if (!this.socket || !this.socket.connected) {
            this.emit(CollaborationEvent.ERROR, {
                message: "未连接到服务器，无法加入房间"
            });
            return;
        }

        // 生成唯一的用户ID
        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        this.socket.emit(CollaborationEvent.JOIN_ROOM, {
            roomId,
            userId,
            username
        }, (response: { success: boolean; error?: string; session?: CollaborationSession }) => {
            if (response.success) {
                this.session = response.session!;
                this.session.isConnected = true;
                // 3. 添加心跳机制保持连接活跃
                this.startHeartbeat();
                console.log("Joined room:", this.session);
                this.emit(CollaborationEvent.JOIN_ROOM, this.session);
            } else {
                this.emit(CollaborationEvent.ERROR, {
                    message: response.error || "加入房间失败"
                });
            }
        });
    }
    // 添加心跳机制
    private startHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('heartbeat', {
                    userId: this.session?.userId,
                    roomId: this.session?.roomId
                });
            } else {
                console.log('Reconnecting due to heartbeat failure');
                // this.reconnect();
            }
        }, 15000); // 15秒一次心跳
    }
    // 离开协作房间
    public leaveRoom(): void {
        if (!this.socket || !this.session) {
            return;
        }

        this.socket.emit(CollaborationEvent.LEAVE_ROOM, {
            roomId: this.session.roomId,
            userId: this.session.userId
        });

        this.session = null;
        this.emit(CollaborationEvent.LEAVE_ROOM);
    }

    // 断开连接
    public disconnect(): void {
        if (this.session) {
            this.leaveRoom();
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // 同步场景数据
    public syncScene(elements: ExcalidrawElement[], appState: Partial<AppState>): void {
        if (!this.socket || !this.session) {
            return;
        }

        this.socket.emit(CollaborationEvent.SYNC_SCENE, {
            roomId: this.session.roomId,
            userId: this.session.userId,
            elements,
            appState
        });
    }

    // 更新元素
    public updateElement(elementId: string, updates: Partial<ExcalidrawElement>): void {
        if (!this.socket || !this.session) {
            return;
        }

        this.socket.emit(CollaborationEvent.UPDATE_ELEMENT, {
            roomId: this.session.roomId,
            userId: this.session.userId,
            elementId,
            updates
        });
    }

    // 添加元素
    public addElement(element: ExcalidrawElement): void {
        if (!this.socket || !this.session) {
            return;
        }

        this.socket.emit(CollaborationEvent.ADD_ELEMENT, {
            roomId: this.session.roomId,
            userId: this.session.userId,
            element
        });
    }

    // 删除元素
    public deleteElement(elementId: string): void {
        if (!this.socket || !this.session) {
            return;
        }

        this.socket.emit(CollaborationEvent.DELETE_ELEMENT, {
            roomId: this.session.roomId,
            userId: this.session.userId,
            elementId
        });
    }

    // 更新光标位置
    public updateCursorPosition(x: number, y: number): void {
        if (!this.socket || !this.session) {
            return;
        }

        this.socket.emit(CollaborationEvent.CURSOR_POSITION, {
            roomId: this.session.roomId,
            userId: this.session.userId,
            x,
            y
        });
    }

    // 添加事件监听器
    public on(event: string, callback: (...args: any[]) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    // 移除事件监听器
    public off(event: string, callback: (...args: any[]) => void): void {
        if (!this.listeners.has(event)) {
            return;
        }

        const callbacks = this.listeners.get(event)!;
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }

    // 触发事件
    private emit(event: string, ...args: any[]): void {
        if (!this.listeners.has(event)) {
            return;
        }

        this.listeners.get(event)!.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }

    // 获取当前会话
    public getSession(): CollaborationSession | null {
        return this.session;
    }

    // 检查是否已连接
    public isConnected(): boolean {
        return !!this.socket && this.socket.connected;
    }

    // 检查是否已加入房间
    public isInRoom(): boolean {
        return !!this.session && this.session.isConnected;
    }

    // 获取连接的传输类型
    public getTransportType(): string | null {
        if (!this.socket || !this.socket.io || !this.socket.io.engine) {
            return null;
        }
        return this.socket.io.engine.transport.name;
    }
}

// 导出单例实例
export const collaborationService = new CollaborationService();
