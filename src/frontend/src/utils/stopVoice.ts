/**
 * Plays "STOP!" using the Web Speech API
 * @throws Error if speech synthesis is unavailable or blocked
 */
export async function playStopVoice(): Promise<void> {
  if (!('speechSynthesis' in window)) {
    throw new Error('Speech synthesis not supported in this browser');
  }

  return new Promise((resolve, reject) => {
    try {
      const utterance = new SpeechSynthesisUtterance('STOP!');
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown speech synthesis error'));
    }
  });
}
