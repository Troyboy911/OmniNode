'use client';

import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei';
import { Brain, Eye, Maximize2, Minimize2, Play, Pause, RotateCcw } from 'lucide-react';
import * as THREE from 'three';

// 3D Agent Entity Component
function AgentEntity({ 
  position, 
  agent, 
  onClick 
}: { 
  position: [number, number, number]; 
  agent: any;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
      
      // Rotation based on status
      if (agent.status === 'working') {
        meshRef.current.rotation.y += 0.02;
      }
    }
  });

  // Color based on performance
  const getColor = () => {
    const performance = agent.performance?.successRate || 0.5;
    if (performance > 0.9) return '#00ff00';
    if (performance > 0.7) return '#00d4ff';
    if (performance > 0.5) return '#ffaa00';
    return '#ff4444';
  };

  // Size based on importance
  const size = 0.3 + (agent.performance?.tasksCompleted || 0) / 500;

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <meshStandardMaterial
          color={getColor()}
          emissive={getColor()}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      
      {/* Agent name label */}
      <Text
        position={[0, size + 0.5, 0]}
        fontSize={0.2}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        {agent.name}
      </Text>
      
      {/* Status indicator ring */}
      {agent.status === 'working' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size + 0.1, 0.02, 16, 32]} />
          <meshBasicMaterial color="#ffaa00" />
        </mesh>
      )}
    </group>
  );
}

// Connection lines between agents
function AgentConnections({ agents }: { agents: any[] }) {
  const lines: JSX.Element[] = [];
  
  agents.forEach((agent, i) => {
    agents.forEach((otherAgent, j) => {
      if (i < j && Math.random() > 0.7) {
        const start = new THREE.Vector3(
          Math.cos((i / agents.length) * Math.PI * 2) * 3,
          0,
          Math.sin((i / agents.length) * Math.PI * 2) * 3
        );
        const end = new THREE.Vector3(
          Math.cos((j / agents.length) * Math.PI * 2) * 3,
          0,
          Math.sin((j / agents.length) * Math.PI * 2) * 3
        );
        
        lines.push(
          <Line
            key={`${i}-${j}`}
            points={[start, end]}
            color="#00d4ff"
            lineWidth={1}
            opacity={0.3}
            transparent
          />
        );
      }
    });
  });
  
  return <>{lines}</>;
}

// Temporal Timeline Visualization
function TemporalTimeline({ events }: { events: any[] }) {
  return (
    <group position={[0, -2, 0]}>
      {events.map((event, index) => (
        <group key={index} position={[index * 0.5 - 2, 0, 0]}>
          <Sphere args={[0.1, 16, 16]}>
            <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
          </Sphere>
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.1}
            color="#ffffff"
            anchorX="center"
          >
            {event.name}
          </Text>
        </group>
      ))}
    </group>
  );
}

// Main Neural Cockpit V2 Component
export default function NeuralCockpitV2({ agents }: { agents: any[] }) {
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'timeline' | 'network'>('3d');

  const mockEvents = [
    { name: 'Task Start', time: '10:00' },
    { name: 'Collaboration', time: '10:15' },
    { name: 'Milestone', time: '10:30' },
    { name: 'Completion', time: '10:45' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="chrome-surface rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold neon-text flex items-center gap-3">
              <Eye className="w-8 h-8" />
              NEURAL COCKPIT V2
            </h1>
            <p className="text-gray-400 mt-2">
              Living 3D data environment with temporal causality visualization
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="chrome-button rounded-lg px-4 py-2 flex items-center gap-2"
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isAnimating ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="chrome-button rounded-lg px-4 py-2 flex items-center gap-2"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === '3d' ? 'chrome-button' : 'glass-effect'
            }`}
          >
            3D View
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'timeline' ? 'chrome-button' : 'glass-effect'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('network')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'network' ? 'chrome-button' : 'glass-effect'
            }`}
          >
            Network
          </button>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className={`chrome-surface rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        <div style={{ height: isFullscreen ? '100vh' : '600px' }} className="relative">
          <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00d4ff" />
            
            {/* Agent Entities */}
            {agents.map((agent, index) => {
              const angle = (index / agents.length) * Math.PI * 2;
              const radius = 3;
              const position: [number, number, number] = [
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius,
              ];
              
              return (
                <AgentEntity
                  key={agent.id}
                  position={position}
                  agent={agent}
                  onClick={() => setSelectedAgent(agent)}
                />
              );
            })}
            
            {/* Connections */}
            <AgentConnections agents={agents} />
            
            {/* Temporal Timeline */}
            {viewMode === 'timeline' && <TemporalTimeline events={mockEvents} />}
            
            {/* Grid */}
            <gridHelper args={[20, 20, '#00d4ff', '#333333']} />
            
            {/* Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={isAnimating}
              autoRotateSpeed={0.5}
            />
          </Canvas>

          {/* Overlay Info */}
          {selectedAgent && (
            <div className="absolute top-4 right-4 chrome-surface rounded-lg p-4 max-w-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">{selectedAgent.name}</h3>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Role: </span>
                  <span className="text-white">{selectedAgent.role}</span>
                </div>
                <div>
                  <span className="text-gray-400">Status: </span>
                  <span className="text-white capitalize">{selectedAgent.status}</span>
                </div>
                <div>
                  <span className="text-gray-400">Success Rate: </span>
                  <span className="text-green-400">
                    {(selectedAgent.performance?.successRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Tasks: </span>
                  <span className="text-white">{selectedAgent.performance?.tasksCompleted}</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls Legend */}
          <div className="absolute bottom-4 left-4 glass-effect rounded-lg p-3 text-xs text-gray-400">
            <p>🖱️ Left Click + Drag: Rotate</p>
            <p>🖱️ Right Click + Drag: Pan</p>
            <p>🖱️ Scroll: Zoom</p>
            <p>🖱️ Click Agent: View Details</p>
          </div>
        </div>
      </div>

      {/* Agent Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="chrome-surface rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Active Agents</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {agents.filter(a => a.status === 'active' || a.status === 'working').length}
          </p>
        </div>

        <div className="chrome-surface rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Avg Performance</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(agents.reduce((sum, a) => sum + (a.performance?.successRate || 0), 0) / agents.length * 100).toFixed(0)}%
          </p>
        </div>

        <div className="chrome-surface rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Total Tasks</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {agents.reduce((sum, a) => sum + (a.performance?.tasksCompleted || 0), 0)}
          </p>
        </div>

        <div className="chrome-surface rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Synergy Score</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(agents.reduce((sum, a) => sum + (a.performance?.resourceUsage || 0), 0) / agents.length * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}