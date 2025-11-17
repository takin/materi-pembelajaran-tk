import { useState, useRef, useCallback, useEffect } from 'react'
import OpenAI from 'openai'

interface UseVoiceInputProps {
  onTranscript: (text: string, isFinal: boolean) => void
  apiKey?: string
  language?: string
  streamingMode?: boolean // Enable continuous streaming
  chunkDuration?: number // Duration in ms before sending chunk
}

interface UseVoiceInputReturn {
  isListening: boolean
  isProcessing: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
}

export function useVoiceInput({
  onTranscript,
  apiKey,
  streamingMode = true,
  chunkDuration = 5000, // Send chunks every 5 seconds (increased for more complete audio)
}: UseVoiceInputProps): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const processingQueueRef = useRef<Blob[]>([])
  const isProcessingChunkRef = useRef(false)

  const mimeTypeRef = useRef<string>('audio/webm')
  const fileExtensionRef = useRef<string>('webm')

  // Create OpenAI client (memoized to avoid recreating on each render)
  const openaiClientRef = useRef<OpenAI | null>(null)

  const startListening = useCallback(async () => {
    try {
      setError(null)
      audioChunksRef.current = []
      processingQueueRef.current = []

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Try different MIME types that Whisper supports
      let mimeType = 'audio/webm'
      let fileExtension = 'webm'

      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
        fileExtension = 'webm'
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm'
        fileExtension = 'webm'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
        fileExtension = 'mp4'
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg'
        fileExtension = 'mp3'
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav'
        fileExtension = 'wav'
      }

      mimeTypeRef.current = mimeType
      fileExtensionRef.current = fileExtension

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      // Collect audio chunks
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          if (streamingMode) {
            // In streaming mode, process each chunk immediately
            processingQueueRef.current.push(event.data)
            processNextChunk()
          } else {
            // In non-streaming mode, collect all chunks
            audioChunksRef.current.push(event.data)
          }
        }
      }

      // Start recording with chunks
      if (streamingMode) {
        // Record in chunks for streaming
        mediaRecorder.start(chunkDuration)
      } else {
        // Continuous recording
        mediaRecorder.start()
      }

      setIsListening(true)
    } catch (err) {
      console.error('❌ Error starting voice input:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to access microphone. Please check permissions.',
      )
    }
  }, [streamingMode, chunkDuration])

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsListening(false)
    audioChunksRef.current = []
    processingQueueRef.current = []
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const processNextChunk = async () => {
    if (
      isProcessingChunkRef.current ||
      processingQueueRef.current.length === 0
    ) {
      return
    }

    isProcessingChunkRef.current = true
    setIsProcessing(true)

    const chunk = processingQueueRef.current.shift()!
    await transcribeWithWhisper(chunk)

    isProcessingChunkRef.current = false
    setIsProcessing(false)

    // Process next chunk if available
    if (processingQueueRef.current.length > 0) {
      processNextChunk()
    }
  }

  const transcribeWithWhisper = async (audioBlob: Blob) => {
    try {
      // Skip if audio is too small (minimum 10KB for valid audio)
      if (audioBlob.size < 10000) {
        return
      }

      // Get API key from prop or environment variable
      const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY

      if (!key) {
        throw new Error(
          'OpenAI API key not found. Please set VITE_OPENAI_API_KEY in .env file.',
        )
      }

      // Initialize OpenAI client if not already done
      if (!openaiClientRef.current) {
        openaiClientRef.current = new OpenAI({
          apiKey: key,
          dangerouslyAllowBrowser: true, // Required for browser usage
        })
      }

      // ALWAYS create a new blob with the correct MIME type
      // MediaRecorder chunks might not have consistent type metadata
      const mimeType = mimeTypeRef.current
      const fileExtension = fileExtensionRef.current

      // Force the correct MIME type for all chunks
      const finalBlob = new Blob([audioBlob], { type: mimeType })

      // Validate that blob is not empty and has reasonable size
      if (finalBlob.size < 10000) {
        return
      }

      // Create a File object from the Blob (required by OpenAI SDK)
      const filename = `audio.${fileExtension}`
      const audioFile = new File([finalBlob], filename, { type: mimeType })

      console.log('audio file:', audioFile)

      // Use OpenAI SDK to transcribe
      const transcription =
        await openaiClientRef.current.audio.transcriptions.create({
          file: audioFile,
          language: 'id',
          model: 'gpt-4o-mini-transcribe',
          prompt:
            'You are a helpful assistant that transcribes audio to text. your task is to translate the audio to english text. for example if teh audio is "maju dua langkah", you should translate it to "move forward 2", "belok kiri" to "turn left" and "belok kanan" to "turn right". the audio is in indonesian language.',
          stream: false,
        })
      stopListening()
      onTranscript(transcription.text, true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to transcribe audio',
      )
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [])

  return {
    isListening,
    isProcessing,
    error,
    startListening,
    stopListening,
    toggleListening,
  }
}
