// contexts/DataContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { Task, RoutineTask, MoodEntry, AppData } from '@/types';

// Default routine tasks
const defaultRoutineTasks: RoutineTask[] = [
  { id: '1', text: "Name 5 things you can see", completed: false },
  { id: '2', text: "Name 4 things you can touch", completed: false },
  { id: '3', text: "Name 3 things you can hear", completed: false },
  { id: '4', text: "Name 2 things you can smell", completed: false },
  { id: '5', text: "Name 1 thing you can taste", completed: false },
];

// Add this helper function to convert Firestore data
// Update your convertFirestoreData function:
// Replace the convertFirestoreData function with this:
const convertFirestoreData = <T,>(data: T): T => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => convertFirestoreData(item)) as unknown as T;
  }
  
  if (data instanceof Timestamp) {
    return data.toDate() as unknown as T;
  }
  
  const converted = { ...data } as Record<string, unknown>;
  
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    
    if (value && typeof value === 'object') {
      if (value instanceof Timestamp) {
        converted[key] = value.toDate();
      } else if (Array.isArray(value)) {
        converted[key] = value.map(item => convertFirestoreData(item));
      } else {
        converted[key] = convertFirestoreData(value);
      }
    }
  });
  
  return converted as T;
};

interface DataContextType {
  data: AppData;
  loading: boolean;
  saveData: (newData: Partial<AppData>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({
    moodHistory: [],
    tasks: [],
    routineTasks: defaultRoutineTasks,
    reflections: [],
    lastSaved: null
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Function to refresh data manually
  const refreshData = async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        const convertedData = convertFirestoreData(firestoreData) as AppData;
        
        // Ensure we have routine tasks even if they're not in Firebase
        const dataWithDefaults = {
          ...convertedData,
          routineTasks: convertedData.routineTasks || defaultRoutineTasks
        };
        
        setData(dataWithDefaults);
      } else {
        // Create initial document if it doesn't exist
        await setDoc(userDocRef, {
          moodHistory: [],
          tasks: [],
          routineTasks: defaultRoutineTasks,
          reflections: [],
          lastSaved: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // First, try to get the document once to ensure it exists
    const initializeData = async () => {
      try {
        const docSnap = await getDoc(userDocRef);
        
        if (!docSnap.exists()) {
          // Create initial document with default data
          await setDoc(userDocRef, {
            moodHistory: [],
            tasks: [],
            routineTasks: defaultRoutineTasks,
            reflections: [],
            lastSaved: serverTimestamp()
          });
        }
        
        // Now set up the real-time listener
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const firestoreData = docSnap.data();
            const convertedData = convertFirestoreData(firestoreData) as AppData;
            
            // Ensure we have routine tasks
            const dataWithDefaults = {
              ...convertedData,
              routineTasks: convertedData.routineTasks || defaultRoutineTasks
            };
            
            setData(dataWithDefaults);
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
      }
    };

    const unsubscribePromise = initializeData();

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [currentUser]);

  const saveData = async (newData: Partial<AppData>) => {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const updatedData = { ...data, ...newData, lastSaved: new Date() };
    
    try {
      await setDoc(userDocRef, updatedData, { merge: true });
      setData(updatedData);
    } catch (error) {
      console.error('Error saving data:', error);
      // Try to refresh data if save fails
      refreshData();
    }
  };

  const value = {
    data,
    loading,
    saveData,
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}