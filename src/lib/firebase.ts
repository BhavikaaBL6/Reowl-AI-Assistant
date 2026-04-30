import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

export const isDemoMode = !firebaseConfig.apiKey || 
                          firebaseConfig.apiKey.startsWith("remixed") || 
                          firebaseConfig.apiKey === "MY_API_KEY" ||
                          firebaseConfig.apiKey.includes("<") ||
                          firebaseConfig.apiKey === "";

interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null) => {
  if (error.code === 'permission-denied') {
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid || 'anonymous',
        email: auth.currentUser?.email || '',
        emailVerified: auth.currentUser?.emailVerified || false,
        isAnonymous: auth.currentUser?.isAnonymous || false,
        providerInfo: auth.currentUser?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  
  if (error.code === 'unavailable') {
    console.warn("Firestore is currently unavailable (offline or connection failed). The app will operate in offline mode.");
  }
  
  throw error;
};

const app = isDemoMode ? null : initializeApp(firebaseConfig);
export const auth = isDemoMode ? ({} as any) : getAuth(app!);
export const db = isDemoMode ? null : getFirestore(app!, firebaseConfig.firestoreDatabaseId);
export const googleProvider = isDemoMode ? null : new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  console.log("SignIn: Starting flow...");
  if (isDemoMode) {
    console.log("SignIn: Using Demo Mode");
    // Return a mock user for Demo Mode
    const mockUser = {
      uid: "guest-user-id",
      email: "guest@reowl.app",
      displayName: "",
      photoURL: "https://picsum.photos/seed/guest/200/200",
    };
    localStorage.setItem("reowl_guest_user", JSON.stringify(mockUser));
    return mockUser as any;
  }

  try {
    console.log("SignIn: Opening Google Auth Popup...");
    const result = await signInWithPopup(auth, googleProvider!);
    const user = result.user;
    console.log("SignIn: Auth successful for", user.email);
    
    // Sync to Firestore
    console.log("SignIn: Syncing profile to Firestore...");
    const userRef = doc(db!, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log("SignIn: Creating new user profile");
      await setDoc(userRef, {
        userId: user.uid,
        email: user.email,
        displayName: "", // Start empty
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          studyTime: 0,
          goalsHit: 0,
          totalNotes: 0,
          avgAccuracy: 0
        }
      });
    } else {
      console.log("SignIn: Updating existing user profile");
      const existingData = userSnap.data();
      await setDoc(userRef, {
        displayName: existingData?.displayName || "",
        photoURL: existingData?.photoURL || user.photoURL,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    
    console.log("SignIn: Profile sync complete");
    return user;
  } catch (error) {
    console.error("Auth Error:", error);
    throw error;
  }
};

export const logout = () => {
  if (isDemoMode) {
    localStorage.removeItem("reowl_guest_user");
    window.location.reload(); // Refresh to clear state
    return Promise.resolve();
  }
  return signOut(auth);
};

export const updateUserProfile = async (uid: string, data: any) => {
  if (isDemoMode) {
    const savedUser = localStorage.getItem("reowl_guest_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const updatedUser = { ...parsedUser, ...data };
      localStorage.setItem("reowl_guest_user", JSON.stringify(updatedUser));
      return updatedUser;
    }
    return data;
  }

  try {
    const userRef = doc(db!, "users", uid);
    const updateData = {
      ...data,
      userId: uid, // Always include for consistency/create-on-merge
      updatedAt: serverTimestamp()
    };
    await setDoc(userRef, updateData, { merge: true });
    return data;
  } catch (error) {
    handleFirestoreError(error, 'update', `/users/${uid}`);
  }
};
