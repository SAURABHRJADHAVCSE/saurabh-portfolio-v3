/**
 * Authentication Configuration
 * Project-wide settings for authentication behavior
 */
export interface AuthConfig {
  emailVerification: {
    required: boolean;
    sendOnSignup: boolean;
  };
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

/**
 * Default authentication configuration
 * Modify these flags based on project requirements
 */
export const AUTH_CONFIG: AuthConfig = {
  emailVerification: {
    required: true,   // Users must verify email before accessing features
    sendOnSignup: true, // Send verification email on signup
  },
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
};

/**
 * Password strength checker
 */
export const checkPasswordStrength = (password: string, email?: string) => {
  const { passwordRequirements } = AUTH_CONFIG;
  const strength = {
    score: 0,
    feedback: [] as string[],
    isValid: password.length >= passwordRequirements.minLength,
  };

  // ── Penalty: password is (or contains) the user's email ──
  if (email) {
    const lowerPwd = password.toLowerCase();
    const lowerEmail = email.toLowerCase();
    const emailLocal = lowerEmail.split('@')[0]; // part before @

    if (lowerPwd === lowerEmail || lowerPwd.includes(lowerEmail)) {
      strength.feedback.push('Password must not be your email address');
      strength.isValid = false;
      return strength; // score stays 0 → Weak
    }
    if (emailLocal.length >= 4 && lowerPwd.includes(emailLocal)) {
      strength.feedback.push('Password should not contain your email username');
      strength.isValid = false;
      return strength; // score stays 0 → Weak
    }
  }

  // ── Penalty: password looks like an email address ──
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(password)) {
    strength.feedback.push('Password should not be an email address');
    strength.isValid = false;
    return strength; // score stays 0 → Weak
  }

  // Length check
  if (password.length >= passwordRequirements.minLength) {
    strength.score += 1;
  } else {
    strength.feedback.push(`At least ${passwordRequirements.minLength} characters`);
  }

  // Uppercase check
  if (passwordRequirements.requireUppercase) {
    if (/[A-Z]/.test(password)) {
      strength.score += 1;
    } else {
      strength.feedback.push('Include uppercase letters');
    }
  }

  // Lowercase check
  if (passwordRequirements.requireLowercase) {
    if (/[a-z]/.test(password)) {
      strength.score += 1;
    } else {
      strength.feedback.push('Include lowercase letters');
    }
  }

  // Numbers check
  if (passwordRequirements.requireNumbers) {
    if (/\d/.test(password)) {
      strength.score += 1;
    } else {
      strength.feedback.push('Include numbers');
    }
  }

  // Special characters check
  if (passwordRequirements.requireSpecialChars) {
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength.score += 1;
    } else {
      strength.feedback.push('Include special characters');
    }
  }

  // Bonus for extra length beyond the minimum requirement
  if (password.length >= 12) strength.score += 0.5;
  if (password.length >= 16) strength.score += 0.5;

  return strength;
};
