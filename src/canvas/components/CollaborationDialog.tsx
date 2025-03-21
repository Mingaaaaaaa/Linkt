import React, { useState, useEffect } from 'react';
import {
  collaborationService,
  CollaborationEvent,
  CollaborationSession,
  CollaborationUser
} from '../../services/CollaborationService';

interface CollaborationDialogProps {
  onClose: () => void;
  onJoinRoom: (session: CollaborationSession) => void;
}

export const CollaborationDialog: React.FC<CollaborationDialogProps> = ({
  onClose,
  onJoinRoom
}) => {
  const [serverUrl, setServerUrl] = useState<string>('https://localhost:3000/');
  const [roomId, setRoomId] = useState<string>('');
  const [username, setUsername] = useState<string>(
    `用户_${Math.floor(Math.random() * 1000)}`
  );
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');

  // 监听连接状态变化
  useEffect(() => {
    const handleConnected = () => {
      setConnectionStatus('connected');
      setTransport(collaborationService.getTransportType());
      setError(null);
    };

    const handleDisconnected = () => {
      setConnectionStatus('disconnected');
      setTransport(null);
    };

    const handleError = (err: { message: string }) => {
      setError(err.message);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
    };

    const handleJoinRoom = (session: CollaborationSession) => {
      setIsConnecting(false);
      setError(null);
      onJoinRoom(session);
    };

    // 添加事件监听
    collaborationService.on(CollaborationEvent.CONNECT, handleConnected);
    collaborationService.on(CollaborationEvent.UPGRADE, handleConnected);
    collaborationService.on(CollaborationEvent.DISCONNECT, handleDisconnected);
    collaborationService.on(CollaborationEvent.ERROR, handleError);
    collaborationService.on(CollaborationEvent.JOIN_ROOM, handleJoinRoom);

    // 清理事件监听
    return () => {
      collaborationService.off(CollaborationEvent.CONNECT, handleConnected);
      collaborationService.off(
        CollaborationEvent.DISCONNECT,
        handleDisconnected
      );
      collaborationService.off(CollaborationEvent.ERROR, handleError);
      collaborationService.off(CollaborationEvent.JOIN_ROOM, handleJoinRoom);
    };
  }, [serverUrl, onJoinRoom]);

  const handleConnect = () => {
    setConnectionStatus('connecting');
    collaborationService.init(serverUrl);
  };

  const handleJoinClick = () => {
    if (!roomId.trim()) {
      setError('请输入房间ID');
      return;
    }

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    setIsConnecting(true);
    setError(null);
    collaborationService.joinRoom(roomId.trim(), username.trim());
  };

  const handleCreateRoom = () => {
    // 创建一个随机房间ID
    const newRoomId = `room_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    setRoomId(newRoomId);
  };

  return (
    <div
      className='collaboration-dialog'
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        width: '400px',
        zIndex: 1000
      }}
    >
      <h2 style={{ margin: '0 0 20px' }}>协同编辑</h2>

      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px'
          }}
        >
          <span>连接状态: </span>
          <span
            style={{
              marginLeft: '8px',
              color:
                connectionStatus === 'connected'
                  ? 'green'
                  : connectionStatus === 'connecting'
                  ? 'orange'
                  : 'red',
              fontWeight: 'bold'
            }}
          >
            {connectionStatus === 'connected'
              ? '已连接'
              : connectionStatus === 'connecting'
              ? '连接中...'
              : '未连接'}
          </span>
        </div>

        {transport && (
          <div style={{ marginBottom: '10px' }}>
            <span>传输方式: </span>
            <span style={{ fontWeight: 'bold', marginLeft: '8px' }}>
              {transport}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          服务器地址
        </label>
        <input
          type='text'
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          placeholder='输入服务器地址'
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
          disabled={connectionStatus === 'connecting'}
        />
      </div>

      {connectionStatus === 'disconnected' && (
        <button
          onClick={handleConnect}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'block',
            width: '100%',
            marginBottom: '15px'
          }}
        >
          连接服务器
        </button>
      )}

      <div style={{ marginBottom: '15px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px'
          }}
        >
          <label>房间ID</label>
          <button
            onClick={handleCreateRoom}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            disabled={connectionStatus !== 'connected'}
          >
            创建房间
          </button>
        </div>
        <input
          type='text'
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder='输入房间ID或创建新房间'
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
          disabled={connectionStatus !== 'connected'}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>用户名</label>
        <input
          type='text'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder='输入您的名称'
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
          disabled={connectionStatus !== 'connected'}
        />
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '15px'
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid #ccc',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          disabled={isConnecting}
        >
          取消
        </button>
        <button
          onClick={handleJoinClick}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: connectionStatus !== 'connected' ? 0.5 : 1
          }}
          disabled={connectionStatus !== 'connected' || isConnecting}
        >
          {isConnecting ? '加入中...' : '加入房间'}
        </button>
      </div>
    </div>
  );
};
