import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, getDocFromServer } from "firebase/firestore";
import { auth, db, signInWithGoogle, logout, isDemoMode } from "../lib/firebase";

interface FirebaseContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: () => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeProfileRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      const savedUser = localStorage.getItem("reowl_guest_user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setProfile({
          displayName: parsedUser.displayName || "",
          role: parsedUser.role || null,
          stats: parsedUser.stats || { level: 5, goalsHit: 12, studyTime: 420 },
        });
      } else {
        // Force setup for new guests too
        setProfile({ displayName: "", role: null });
      }
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Clean up previous profile listener if any
      if (unsubscribeProfileRef.current) {
        unsubscribeProfileRef.current();
        unsubscribeProfileRef.current = null;
      }

      setUser(currentUser);
      if (currentUser) {
        // Validate Connection to Firestore
        const testConnection = async () => {
          try {
            await getDocFromServer(doc(db!, 'test', 'connection'));
          } catch (error) {
            if (error instanceof Error && error.message.includes('the client is offline')) {
              console.error("Please check your Firebase configuration or internet connection.");
            }
          }
        };
        testConnection();

        // Ensure profile exists (if they logged in previously but doc is missing or needs sync)
        const syncProfile = async () => {
          try {
            const { doc, getDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
            const userRef = doc(db!, "users", currentUser.uid);
            const snap = await getDoc(userRef);
            if (!snap.exists()) {
              await setDoc(userRef, {
                userId: currentUser.uid,
                email: currentUser.email,
                displayName: "", // Start with empty so we can prompt
                photoURL: currentUser.photoURL,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                stats: { studyTime: 0, goalsHit: 0, totalNotes: 0, avgAccuracy: 0 }
              });
            }
          } catch (e) {
            console.warn("Soft profile sync failed:", e);
          }
        };
        syncProfile();

        // Set a safety timeout for profile loading
        const timeoutId = setTimeout(() => {
          setLoading(false);
        }, 5000); // 5 second safety net

        // Listen to profile changes
        console.log("ProfileSync: Starting listener for", currentUser.uid);
        unsubscribeProfileRef.current = onSnapshot(doc(db!, "users", currentUser.uid), (doc) => {
          console.log("ProfileSync: Received data, exists:", doc.exists());
          clearTimeout(timeoutId);
          const data = doc.data();
          if (data) {
            setProfile({
              ...data,
              displayName: data.displayName || "",
              photoURL: data.photoURL || currentUser.photoURL,
            });
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("ProfileSync: Permission Error for UID:", currentUser.uid, "Error:", error);
          clearTimeout(timeoutId);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileRef.current) {
        unsubscribeProfileRef.current();
      }
    };
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      const newUser = await signInWithGoogle();
      
      // If we're in demo mode, onAuthStateChanged won't trigger, so handle state update manually
      if (isDemoMode) {
        setUser(newUser);
        setProfile({
          displayName: "", // Force manual entry
          role: (newUser as any).role || null,
          stats: { level: 5, goalsHit: 12, studyTime: 420 },
        });
      }
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    return await logout();
  };

  const updateProfile = async (data: any) => {
    if (!user) return;
    
    // Optimistic local update
    setProfile((prev: any) => prev ? ({ ...prev, ...data }) : data);
    if (data.displayName) {
      setUser((prev: any) => prev ? ({ ...prev, displayName: data.displayName }) : null);
    }

    const { updateUserProfile } = await import("../lib/firebase");
    await updateUserProfile(user.uid, data);
  };

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, signIn, signOut, updateProfile }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};
