import { db } from "../../firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";

export const dbService = {
	/**
	 * Pushes a transaction to the user's temporary queue in Firestore.
	 */
	async pushToQueue(uid, transaction) {
		try {
			const queueRef = collection(db, "users", uid, "queue");
			await addDoc(queueRef, {
				...transaction,
				queuedAt: new Date().toISOString()
			});
			return { success: true };
		} catch (error) {
			console.error("Error pushing to queue:", error);
			return { success: false, error };
		}
	},

	/**
	 * Reads all transactions currently in the user's queue.
	 */
	async getQueue(uid) {
		try {
			const queueRef = collection(db, "users", uid, "queue");
			const q = query(queueRef);
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));
		} catch (error) {
			console.error("Error reading queue:", error);
			return [];
		}
	},

	/**
	 * Clears an item from the queue after successful sync to Sheet.
	 */
	async removeFromQueue(uid, docId) {
		try {
			const docRef = doc(db, "users", uid, "queue", docId);
			await deleteDoc(docRef);
			return { success: true };
		} catch (error) {
			console.error("Error removing from queue:", error);
			return { success: false, error };
		}
	},

	/**
	 * Saves or updates the user profile in Firestore.
	 */
	async saveUserProfile(user) {
		try {
			const userRef = doc(db, "users", user.uid);
			await setDoc(userRef, {
				uid: user.uid,
				email: user.email,
				name: user.name,
				picture: user.picture,
				tier: user.tier || 'free',
				lastLogin: new Date().toISOString()
			}, { merge: true });
			return { success: true };
		} catch (error) {
			console.error("Error saving user profile:", error);
			return { success: false, error };
		}
	},

	/**
	 * Reads the user profile from Firestore.
	 */
	async getUserProfile(uid) {
		try {
			const userRef = doc(db, "users", uid);
			const userSnap = await getDoc(userRef);
			if (userSnap.exists()) {
				return { success: true, data: userSnap.data() };
			} else {
				return { success: false, error: "User profile not found" };
			}
		} catch (error) {
			console.error("Error reading user profile:", error);
			return { success: false, error };
		}
	},

	/**
	 * Finds a user profile by email (Useful when we only have email in session)
	 */
	async getUserByEmail(email) {
		try {
			const usersRef = collection(db, "users");
			const q = query(usersRef, where("email", "==", email));
			const querySnapshot = await getDocs(q);
			if (!querySnapshot.empty) {
				return { success: true, data: querySnapshot.docs[0].data() };
			}
			return { success: false, error: "User not found in Firestore" };
		} catch (error) {
			console.error("Error finding user by email:", error);
			return { success: false, error };
		}
	}
};
