
// This is a lightweight, simulated authentication service.
// It does not connect to any database and is designed for UI demonstration purposes.

interface AuthResponse {
  success: boolean;
  message: string;
}

// A simple in-memory store to simulate user existence for the signup feature.
const simulatedUsers = new Set<string>(['admin']);

/**
 * Simulates a user login.
 * Always succeeds if username and password are provided.
 * @param username The username to log in with.
 * @param password The password for the user.
 * @returns A promise that resolves to an AuthResponse.
 */
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!username.trim() || !password.trim()) {
        resolve({ success: false, message: 'Username and password are required.' });
      } else {
        resolve({ success: true, message: 'Login successful!' });
      }
    }, 500); // Simulate network delay
  });
};

/**
 * Simulates a new user signup.
 * Succeeds if the username is not already taken in the simulation.
 * @param username The new username.
 * @param password The password for the new account.
 * @returns A promise that resolves to an AuthResponse.
 */
export const signup = async (username: string, password: string): Promise<AuthResponse> => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (!username.trim() || !password.trim()) {
        resolve({ success: false, message: 'Username and password cannot be empty.' });
        return;
      }
      if (simulatedUsers.has(username.toLowerCase())) {
        resolve({ success: false, message: 'Username is already taken.' });
      } else {
        simulatedUsers.add(username.toLowerCase());
        resolve({ success: true, message: 'Account created successfully!' });
      }
    }, 500); // Simulate network delay
  });
};
