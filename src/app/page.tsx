"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Home, Heart, Users, Clock, Play, Check, Plus, Trash2, 
  TrendingUp, Pause, RotateCcw, Settings, Star, Edit, Calendar,
  Volume2, VolumeX, Sun, Moon, Cloud, Zap, Leaf, Coffee,
  History, Save, Download, Upload, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import AuthGate from '@/components/AuthGate';

// Use types from your types file
import { Task, RoutineTask, MoodEntry, EmotionalState, LocationType, BreathingPreset } from '@/types';

function PremiumGroundingAppContent() {
  // Use Auth and Data contexts
  const { currentUser, logout } = useAuth();
  const { data, saveData, loading, refreshData} = useData();
  
  // Extract data from context
  const { moodHistory = [], tasks = [], routineTasks = [], reflections = [] } = data || {};

  // Default routine tasks if none exist
  const defaultRoutineTasks: RoutineTask[] = [
    { id: '1', text: "Name 5 things you can see", completed: false },
    { id: '2', text: "Name 4 things you can touch", completed: false },
    { id: '3', text: "Name 3 things you can hear", completed: false },
    { id: '4', text: "Name 2 things you can smell", completed: false },
    { id: '5', text: "Name 1 thing you can taste", completed: false },
  ];

  // Initialize routine tasks if they don't exist
  useEffect(() => {
    if (routineTasks.length === 0 && data) {
      saveData({ routineTasks: defaultRoutineTasks });
    }
  }, [routineTasks, data, saveData]);

  // App UI state (not persisted to Firebase)
  const [location, setLocation] = useState<LocationType>('Home');
  const [customLocation, setCustomLocation] = useState('');
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('Calm');
  const [emotionalIntensity, setEmotionalIntensity] = useState(5);
  const [reflection, setReflection] = useState("");
  const [newTask, setNewTask] = useState("");
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingTime, setBreathingTime] = useState(0);
  const [breathingPreset, setBreathingPreset] = useState('4-4-4');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [meditationActive, setMeditationActive] = useState(false);
  const [meditationTime, setMeditationTime] = useState(300);
  const [meditationElapsed, setMeditationElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState<'main' | 'history'>('main');
  const [historyDate, setHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  // Timer refs
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const meditationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Breathing presets
  const breathingPresets: BreathingPreset[] = [
    { id: '4-4-4', name: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, description: 'Equal breathing for balance' },
    { id: '4-7-8', name: 'Relaxing Breath', inhale: 4, hold: 7, exhale: 8, description: 'Promotes relaxation' },
    { id: '6-2-6', name: 'Energizing Breath', inhale: 6, hold: 2, exhale: 6, description: 'Boosts energy' },
  ];

  // Add a new task to the priority list
  const addTask = () => {
    if (newTask.trim() !== "") {
      const newTaskItem: Task = {
        id: Date.now().toString(),
        text: newTask,
        priority: tasks.length + 1,
        completed: false,
        createdAt: new Date()
      };
      saveData({ tasks: [...tasks, newTaskItem] });
      setNewTask("");
    }
  };

  // Toggle routine task completion
  const toggleRoutineTask = (id: string) => {
    const updatedRoutineTasks = (routineTasks.length > 0 ? routineTasks : defaultRoutineTasks).map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveData({ routineTasks: updatedRoutineTasks });
  };

  // Toggle priority task completion
  const togglePriorityTask = (id: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveData({ tasks: updatedTasks });
  };

  // Delete a task
  const deleteTask = (id: string) => {
    const filteredTasks = tasks.filter(task => task.id !== id);
    // Re-prioritize remaining tasks
    const updatedTasks = filteredTasks.map((task, index) => ({
      ...task,
      priority: index + 1
    }));
    saveData({ tasks: updatedTasks });
  };

  // Update emotional state and history
  const updateEmotionalState = (state: EmotionalState) => {
    setEmotionalState(state);
    const newMoodEntry: MoodEntry = { 
      state, 
      timestamp: new Date(), 
      intensity: emotionalIntensity 
    };
    saveData({ moodHistory: [...moodHistory, newMoodEntry] });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTask(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask !== targetId) {
      const draggedIndex = tasks.findIndex(t => t.id === draggedTask);
      const targetIndex = tasks.findIndex(t => t.id === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newTasks = [...tasks];
        const [draggedItem] = newTasks.splice(draggedIndex, 1);
        newTasks.splice(targetIndex, 0, draggedItem);
        
        // Update priorities
        const updatedTasks = newTasks.map((task, index) => ({
          ...task,
          priority: index + 1
        }));
        
        saveData({ tasks: updatedTasks });
      }
    }
    setDraggedTask(null);
  };

  // Save reflection
  const saveReflection = () => {
    if (reflection.trim() !== "") {
      const reflectionWithDate = `${new Date().toLocaleDateString()}: ${reflection}`;
      saveData({ reflections: [...reflections, reflectionWithDate] });
      setReflection("");
    }
  };

  // Get location display text
  const getLocationDisplay = () => {
    return location === 'Other' ? customLocation || 'Custom Location' : location;
  };

  // Get emotional state color
  const getEmotionalStateColor = (state: EmotionalState) => {
    const colors: Record<EmotionalState, string> = {
      'Calm': 'bg-blue-100 text-blue-800',
      'Anxious': 'bg-yellow-100 text-yellow-800',
      'Overwhelmed': 'bg-red-100 text-red-800',
      'Focused': 'bg-green-100 text-green-800',
      'Energized': 'bg-purple-100 text-purple-800',
      'Tired': 'bg-gray-100 text-gray-800',
      'Happy': 'bg-pink-100 text-pink-800',
      'Sad': 'bg-indigo-100 text-indigo-800'
    };
    return colors[state];
  };

  // Get emotional state icon
  const getEmotionalStateIcon = (state: EmotionalState): React.ReactElement => {
    const icons: Record<EmotionalState, React.ReactElement> = {
      'Calm': <Leaf className="h-4 w-4" />,
      'Anxious': <Zap className="h-4 w-4" />,
      'Overwhelmed': <Cloud className="h-4 w-4" />,
      'Focused': <Sun className="h-4 w-4" />,
      'Energized': <Coffee className="h-4 w-4" />,
      'Tired': <Moon className="h-4 w-4" />,
      'Happy': <Star className="h-4 w-4" />,
      'Sad': <Cloud className="h-4 w-4" />
    };
    return icons[state];
  };

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100
  );

  // Breathing exercise functions
  const startBreathingExercise = () => {
    setBreathingActive(true);
    const preset = breathingPresets.find(p => p.id === breathingPreset) || breathingPresets[0];
    setBreathingPhase('inhale');
    setBreathingTime(preset.inhale);
  };

  const pauseBreathingExercise = () => {
    setBreathingActive(false);
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
    }
  };

  const resetBreathingExercise = () => {
    pauseBreathingExercise();
    setBreathingPhase('inhale');
    const preset = breathingPresets.find(p => p.id === breathingPreset) || breathingPresets[0];
    setBreathingTime(preset.inhale);
  };

  // Meditation timer functions
  const startMeditation = () => {
    setMeditationActive(true);
    setMeditationElapsed(0);
  };

  const pauseMeditation = () => {
    setMeditationActive(false);
    if (meditationIntervalRef.current) {
      clearInterval(meditationIntervalRef.current);
    }
  };

  const resetMeditation = () => {
    pauseMeditation();
    setMeditationElapsed(0);
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format mood data for chart
  const getMoodChartData = () => {
    return moodHistory.map(entry => ({
      date: entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intensity: entry.intensity,
      state: entry.state
    }));
  };

  // Get personalized recommendations
  const getRecommendations = () => {
    const recommendations = [];
    
    // Check for high anxiety
    const recentAnxious = moodHistory.slice(-3).some(entry => 
      entry.state === 'Anxious' && entry.intensity > 7
    );
    if (recentAnxious) {
      recommendations.push("Try the 4-7-8 breathing exercise to calm your nervous system");
    }
    
    // Check for low energy
    const recentTired = moodHistory.slice(-3).some(entry => 
      entry.state === 'Tired' && entry.intensity > 6
    );
    if (recentTired) {
      recommendations.push("Take a short walk outside to boost your energy naturally");
    }
    
    // Check for task completion
    const completedTasks = tasks.filter(t => t.completed).length;
    if (completedTasks === 0 && tasks.length > 0) {
      recommendations.push("Start with your highest priority task to build momentum");
    }
    
    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push("Practice the 5-4-3-2-1 grounding technique for centering");
    }
    
    return recommendations;
  };

  // Filter mood history by date
  const getMoodHistoryByDate = (date: string) => {
    return moodHistory.filter(entry => 
      entry.timestamp.toISOString().split('T')[0] === date
    );
  };

  // Breathing exercise timer effect
  useEffect(() => {
    if (breathingActive) {
      const preset = breathingPresets.find(p => p.id === breathingPreset) || breathingPresets[0];
      
      breathingIntervalRef.current = setInterval(() => {
        setBreathingTime(prev => {
          if (prev <= 1) {
            // Move to next phase
            if (breathingPhase === 'inhale') {
              setBreathingPhase('hold');
              return preset.hold;
            } else if (breathingPhase === 'hold') {
              setBreathingPhase('exhale');
              return preset.exhale;
            } else {
              setBreathingPhase('inhale');
              return preset.inhale;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
    };
  }, [breathingActive, breathingPhase, breathingPreset, breathingPresets]);

  // Meditation timer effect
  useEffect(() => {
    if (meditationActive && meditationElapsed < meditationTime) {
      meditationIntervalRef.current = setInterval(() => {
        setMeditationElapsed(prev => {
          if (prev >= meditationTime) {
            setMeditationActive(false);
            return meditationTime;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (meditationIntervalRef.current) {
        clearInterval(meditationIntervalRef.current);
      }
    };
  }, [meditationActive, meditationElapsed, meditationTime]);

  // Get current breathing preset
  const currentPreset = breathingPresets.find(p => p.id === breathingPreset) || breathingPresets[0];

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-indigo-800">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Main app UI
  <div className="flex justify-end gap-2 mb-2">
    <Button 
    onClick={() => refreshData()} 
    variant="outline" 
    size="sm"
    className="flex items-center gap-1"
     >
      <RotateCcw className="h-4 w-4" />
        Refresh
     </Button>
  </div>
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 md:p-4">
      {/* Logout button */}
      <div className="flex justify-end mb-2">
        <Button 
          onClick={() => logout()} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      
      {/* Save indicator */}
      <AnimatePresence>
        {showSaveIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-100 text-green-800 text-xs p-1 rounded-md text-center mb-2"
          >
            Data saved successfully
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-4 md:mb-6">
          <div className="flex justify-between items-center mb-2">
            <Button 
              variant={activeTab === 'main' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveTab('main')}
              className="text-xs md:text-sm"
            >
              <Home className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Main
            </Button>
            <h1 className="text-xl md:text-3xl font-bold text-indigo-800">Mindfulness Zone</h1>
            <Button 
              variant={activeTab === 'history' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveTab('history')}
              className="text-xs md:text-sm"
            >
              <History className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              History
            </Button>
          </div>
          <p className="text-gray-600 text-xs md:text-sm">Advanced tools for mindfulness and emotional well-being</p>
        </header>

        {activeTab === 'main' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Current State Visualization */}
              <div className="space-y-4 md:space-y-6">
                <Card className="bg-white shadow-lg">
                  <CardHeader className="flex flex-row items-center gap-2 p-3 md:p-6">
                    <Home className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                    <CardTitle className="text-lg md:text-xl">Current Location</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col gap-3 md:gap-4">
                      <Select value={location} onValueChange={(value: LocationType) => setLocation(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Work">Work</SelectItem>
                          <SelectItem value="Outdoors">Outdoors</SelectItem>
                          <SelectItem value="Transit">Transit</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {location === 'Other' && (
                        <Input
                          value={customLocation}
                          onChange={(e) => setCustomLocation(e.target.value)}
                          placeholder="Enter custom location"
                        />
                      )}
                      
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                        <div className="bg-indigo-100 p-2 md:p-3 rounded-full">
                          <Home className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <p className="text-lg md:text-xl font-medium">{getLocationDisplay()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg">
                  <CardHeader className="flex flex-row items-center gap-2 p-3 md:p-6">
                    <Heart className="text-pink-500 h-4 w-4 md:h-5 md:w-5" />
                    <CardTitle className="text-lg md:text-xl">Emotional State</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6">
                    <div className="space-y-3 md:space-y-4">
                      <div className="grid grid-cols-4 gap-1 md:gap-2">
                        {(['Calm', 'Anxious', 'Overwhelmed', 'Focused', 'Energized', 'Tired', 'Happy', 'Sad'] as EmotionalState[]).map((state) => (
                          <Button
                            key={state}
                            variant={emotionalState === state ? "default" : "outline"}
                            size="sm"
                            className={`flex flex-col items-center justify-center h-12 md:h-16 text-xs ${
                              emotionalState === state 
                                ? getEmotionalStateColor(state) 
                                : ''
                            }`}
                            onClick={() => updateEmotionalState(state)}
                          >
                            {getEmotionalStateIcon(state)}
                            <span className="mt-1">{state}</span>
                          </Button>
                        ))}
                      </div>
                      
                      <div className="space-y-2 md:space-y-3">
                        <div>
                          <Label className="text-sm">Intensity: {emotionalIntensity}/10</Label>
                          <Input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={emotionalIntensity} 
                            onChange={(e) => setEmotionalIntensity(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                          <div className={`p-2 md:p-3 rounded-full ${getEmotionalStateColor(emotionalState).replace('text', 'bg')}`}>
                            <Heart className="text-white h-4 w-4 md:h-5 md:w-5" />
                          </div>
                          <div>
                            <p className="text-lg md:text-xl font-medium flex items-center gap-2">
                              {emotionalState} 
                              <span className="text-xs md:text-sm font-normal bg-white px-2 py-1 rounded-full">
                                {emotionalIntensity}/10
                              </span>
                            </p>
                            <p className="text-xs md:text-sm text-gray-500">
                              Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Breathing Exercise */}
              <Card className="bg-white shadow-lg">
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Volume2 className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                    Breathing Exercise
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6">
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex justify-between items-center">
                      <Select value={breathingPreset} onValueChange={setBreathingPreset}>
                        <SelectTrigger className="w-[130px] md:w-[180px]">
                          <SelectValue placeholder="Select preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {breathingPresets.map(preset => (
                            <SelectItem key={preset.id} value={preset.id}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                      >
                        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs md:text-sm text-gray-600 mb-2">{currentPreset.description}</p>
                      <div className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                        {currentPreset.inhale}-{currentPreset.hold}-{currentPreset.exhale}
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <motion.div
                        className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center"
                        animate={{
                          scale: breathingPhase === 'inhale' ? [1, 1.2] : 
                                 breathingPhase === 'hold' ? 1.2 : 
                                 [1.2, 1],
                        }}
                        transition={{
                          duration: breathingTime,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="text-white text-center">
                          <div className="text-xl md:text-2xl font-bold">
                            {breathingTime}
                          </div>
                          <div className="text-xs md:text-sm uppercase">
                            {breathingPhase}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    
                    <div className="flex justify-center gap-2 md:gap-3">
                      {!breathingActive ? (
                        <Button onClick={startBreathingExercise} className="bg-indigo-600 hover:bg-indigo-700 text-xs md:text-sm">
                          <Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Start
                        </Button>
                      ) : (
                        <Button onClick={pauseBreathingExercise} variant="outline" className="text-xs md:text-sm">
                          <Pause className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Pause
                        </Button>
                      )}
                      <Button onClick={resetBreathingExercise} variant="outline" className="text-xs md:text-sm">
                        <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meditation Timer */}
              <Card className="bg-white shadow-lg">
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Moon className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                    Meditation Timer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6">
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex justify-center">
                      <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-indigo-200 flex items-center justify-center">
                        <div className="text-2xl md:text-3xl font-bold">
                          {formatTime(meditationTime - meditationElapsed)}
                        </div>
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500" 
                             style={{ 
                               clipPath: `inset(0 0 0 ${meditationElapsed/meditationTime*100}%)` 
                             }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 md:space-y-3">
                      <Label>Duration: {Math.floor(meditationTime / 60)} minutes</Label>
                      <Input 
                        type="range" 
                        min="60" 
                        max="1800" 
                        step="60"
                        value={meditationTime} 
                        onChange={(e) => setMeditationTime(parseInt(e.target.value))}
                        className="w-full"
                      />
                      
                      <div className="flex justify-center gap-2 md:gap-3 pt-3 md:pt-4">
                        {!meditationActive ? (
                          <Button onClick={startMeditation} className="bg-indigo-600 hover:bg-indigo-700 text-xs md:text-sm">
                            <Play className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Start
                          </Button>
                        ) : (
                          <Button onClick={pauseMeditation} variant="outline" className="text-xs md:text-sm">
                            <Pause className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Pause
                          </Button>
                        )}
                        <Button onClick={resetMeditation} variant="outline" className="text-xs md:text-sm">
                          <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Priority Setting with Drag & Drop */}
              <Card className="bg-white shadow-lg">
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Users className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                    Priority Setting
                    <span className="ml-auto text-xs md:text-sm font-normal bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                      {completionPercentage}% completed
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6">
                  <div className="mb-4 md:mb-6">
                    <Label htmlFor="new-task" className="block mb-2">Add New Task</Label>
                    <div className="flex gap-2">
                      <Input
                        id="new-task"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="What needs your attention?"
                        className="flex-grow"
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                      />
                      <Button onClick={addTask} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-700">Your Priorities</h3>
                      <span className="text-xs md:text-sm text-gray-500">{tasks.length} tasks</span>
                    </div>
                    
                    <AnimatePresence>
                      <ul className="space-y-2">
                        {tasks.map((task, index) => (
                          <motion.li
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            onDragEnd={(event, info) => {
                              // Handle reordering logic here using info.offset.y
                              }}
                            onDrop={(e: React.DragEvent<HTMLLIElement>) => handleDrop(e, task.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-move ${
                              task.completed 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-indigo-50 border-indigo-100'
                            }`}
                          >
                            <div 
                              className={`flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                                task.completed 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-indigo-500 text-white'
                              }`}
                            >
                              {task.priority}
                            </div>
                            
                            <div className="flex-grow">
                              <p className={task.completed ? 'line-through text-gray-500' : ''}>
                                {task.text}
                              </p>
                              <p className="text-xs text-gray-500">
                                 Added: {task.createdAt instanceof Date ? task.createdAt.toLocaleDateString() : new Date(task.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`p-1 md:p-2 ${
                                  task.completed 
                                    ? 'text-green-600 hover:text-green-700' 
                                    : 'text-gray-500 hover:text-indigo-600'
                                }`}
                                onClick={() => togglePriorityTask(task.id)}
                              >
                                {task.completed ? (
                                  <Check className="h-3 w-3 md:h-4 md:w-4" />
                                ) : (
                                  <Play className="h-3 w-3 md:h-4 md:w-4" />
                                )}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 md:p-2 text-gray-500 hover:text-red-600"
                                onClick={() => deleteTask(task.id)}
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    </AnimatePresence>
                    
                    {tasks.length === 0 && (
                      <div className="text-center py-6 md:py-8 text-gray-500">
                        <p>No tasks yet. Add your first priority above.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mood Tracking Chart */}
              <Card className="bg-white shadow-lg">
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <TrendingUp className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                    Mood Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6">
                  <div className="h-48 md-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getMoodChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="intensity" 
                          stroke="#6366f1" 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-3 md:mt-4">
                    <h3 className="font-medium text-gray-700 mb-2">Recent Entries</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {moodHistory.slice(-5).map((entry, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                          <div className={`p-1 rounded ${getEmotionalStateColor(entry.state)}`}>
                            {getEmotionalStateIcon(entry.state)}
                          </div>
                          <div className="flex-grow">
                            <span className="font-medium">{entry.state}</span>
                            <span className="text-xs text-gray-500 ml-2">({entry.intensity}/10)</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Simple Routine Guidance */}
              <Card className="bg-white shadow-lg">
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Clock className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                    Simple Routine
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6">
                  <p className="text-gray-600 mb-3 md:mb-4">
                    Complete these grounding exercises to center yourself:
                  </p>
                  <ul className="space-y-2 md:space-y-3">
                    {(routineTasks.length > 0 ? routineTasks : defaultRoutineTasks).map((task, index) => (
                      <motion.li 
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          task.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-full p-0 ${
                            task.completed 
                              ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' 
                              : 'border-gray-300'
                          }`}
                          onClick={() => toggleRoutineTask(task.id)}
                        >
                          {task.completed && <Check className="h-3 w-3 md:h-4 md:w-4" />}
                        </Button>
                        <span className={task.completed ? 'line-through text-gray-500 text-sm md:text-base' : 'text-sm md:text-base'}>
                          {task.text}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Personalized Recommendations */}
              <Card className="bg-white shadow-lg lg:col-span-2">
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Star className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                    Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    <p className="text-gray-600">
                      Based on your current state and history, here are some suggestions:
                    </p>
                    
                    <ul className="space-y-2 md:space-y-3">
                      {getRecommendations().map((rec, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg"
                        >
                          <div className="mt-1 text-indigo-600">
                            <Star className="h-3 w-3 md:h-4 md:w-4" />
                          </div>
                          <p className="text-sm md:text-base">{rec}</p>
                        </motion.li>
                      ))}
                    </ul>
                    
                    <div className="pt-3 md:pt-4 border-t">
                      <h3 className="font-medium text-gray-700 mb-2">Quick Actions</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Button variant="outline" className="text-xs md:text-sm" onClick={startBreathingExercise}>
                          <Play className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Breathe
                        </Button>
                        <Button variant="outline" className="text-xs md:text-sm" onClick={startMeditation}>
                          <Moon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Meditate
                        </Button>
                        <Button variant="outline" className="text-xs md:text-sm">
                          <Heart className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Mood Log
                        </Button>
                        <Button variant="outline" className="text-xs md:text-sm">
                          <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reflection Section */}
            <Card className="bg-white shadow-lg mb-6 md:mb-8">
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Heart className="text-pink-500 h-4 w-4 md:h-5 md:w-5" />
                  Daily Reflection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <Textarea 
                  placeholder="Take a moment to reflect on how you're feeling right now. What grounding techniques helped you today?" 
                  className="min-h-[100px] md:min-h-[120px]"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
                <div className="flex justify-between items-center mt-3 md:mt-4">
                  <span className="text-xs md:text-sm text-gray-500">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-xs md:text-sm" onClick={saveReflection}>
                    <Save className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Save Reflection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="bg-white shadow-lg mb-6 md:mb-8">
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Settings className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">Export Data</h3>
                    <p className="text-sm text-gray-600">Download your data as a JSON file for backup.</p>
                    <Button 
                      onClick={() => {
                        const dataStr = JSON.stringify({
                          moodHistory,
                          tasks,
                          routineTasks,
                          reflections
                        }, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', 'grounding-app-data.json');
                        linkElement.click();
                      }} 
                      className="w-full text-xs md:text-sm"
                    >
                      <Download className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      Export Data
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">Import Data</h3>
                    <p className="text-sm text-gray-600">Restore your data from a backup file.</p>
                    <div className="relative">
                      <Input 
                        type="file" 
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            try {
                              const contents = e.target?.result as string;
                              const parsedData = JSON.parse(contents);
                              
                              saveData({
                                moodHistory: parsedData.moodHistory || [],
                                tasks: parsedData.tasks || [],
                                routineTasks: parsedData.routineTasks || [],
                                reflections: parsedData.reflections || []
                              });
                              
                              alert('Data imported successfully!');
                            } catch (error) {
                              console.error('Error importing data:', error);
                              alert('Failed to import data. Please check the file format.');
                            }
                          };
                          
                          reader.readAsText(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="import-file"
                      />
                      <Button asChild variant="outline" className="w-full text-xs md:text-sm">
                        <label htmlFor="import-file" className="cursor-pointer">
                          <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Import Data
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
            /* History Tab*/
          <Card className="bg-white shadow-lg">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <History className="text-indigo-600 h-4 w-4 md:h-5 md:w-5" />
                History & Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="history-date" className="block mb-2">Select Date</Label>
                  <Input
                    id="history-date"
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Mood History for {new Date(historyDate).toLocaleDateString()}</h3>
                  {getMoodHistoryByDate(historyDate).length > 0 ? (
                    <div className="space-y-3">
                      {getMoodHistoryByDate(historyDate).map((entry, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`p-2 rounded-full ${getEmotionalStateColor(entry.state)}`}>
                            {getEmotionalStateIcon(entry.state)}
                          </div>
                          <div className="flex-grow">
                            <span className="font-medium">{entry.state}</span>
                            <span className="text-sm text-gray-500 ml-2">({entry.intensity}/10)</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No mood entries for this date.</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Saved Reflections</h3>
                  {reflections.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {reflections.map((reflection, index) => (
                        <div key={index} className="p-3 bg-indigo-50 rounded-lg">
                          <p className="text-sm">{reflection}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No reflections saved yet.</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Weekly Mood Summary</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getMoodChartData().slice(-7)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="intensity" 
                          stroke="#6366f1" 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      // Debugbing Information
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-md text-xs z-50 max-w-xs">
    <div className="font-bold mb-2">Debug Info</div>
    <div>User: {currentUser?.email || 'Not logged in'}</div>
    <div>User ID: {currentUser?.uid || 'N/A'}</div>
    <div>Tasks: {data.tasks.length}</div>
    <div>Mood entries: {data.moodHistory.length}</div>
    <div>Reflections: {data.reflections.length}</div>
    <div>Routine tasks: {data.routineTasks.length}</div>
    <div className="mt-2">
      <button 
        onClick={() => refreshData()}
        className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded mr-2"
      >
        Refresh Data
      </button>
      <button 
        onClick={() => {
          console.log('Current data:', data);
          console.log('Current user:', currentUser);
        }}
        className="bg-green-500 hover:bg-green-600 px-2 py-1 rounded"
      >
        Log Data
      </button>
    </div>
  </div>
)}
    </div>
  );
}

export default function PremiumGroundingApp() {
  return (
    <AuthGate>
      <PremiumGroundingAppContent />
    </AuthGate>
  );
}