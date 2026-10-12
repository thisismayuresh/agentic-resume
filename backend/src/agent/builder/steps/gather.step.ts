import { resumeToText } from '@app/resume';
import type { Session } from '@app/sessions';
import type { BuildContext } from '../builder.types';

export function gatherContext(
  session: Session,
  userMessage: string,
): BuildContext {
  const resumeText = resumeToText(session.resume);
  const answersText = JSON.stringify(session.answers);

  return {
    sessionId: session.sessionId,
    resume: session.resume,
    resumeText,
    jobDescription: session.jobDescription,
    answers: { ...session.answers },
    userMessage,
    sourceText: [
      resumeText,
      session.jobDescription ?? '',
      userMessage,
      answersText,
    ].join('\n'),
  };
}
