import { FormButton } from '../../components/ui';

/**
 * Static account buttons for the POC - neither is wired to anything yet.
 *
 * TODO(auth): "Continue with Google" needs Google OAuth and
 * "Sign up with email" needs the email flow. No auth in this version
 * (README §1), so these stay display-only.
 */
export function AuthButtons() {
  return (
    <div className="auth-buttons">
      <FormButton label="Continue with Google" />
      <FormButton label="Sign up with email" variant="secondary" />
    </div>
  );
}
