'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MicrophoneIcon, 
  SpeakerWaveIcon,
  XMarkIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'
import { useVoiceCommands } from '@/lib/voiceCommands'

interface VoiceCommandsProps {
  onCommandExecuted?: (command: any) => void
  onVoiceInput?: (text: string) => void
  disabled?: boolean
}

export default function VoiceCommands({ 
  onCommandExecuted, 
  onVoiceInput,
  disabled = false 
}: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  
  const {
    isVoiceSupported,
    startListening,
    stopListening,
    processVoiceInput,
    executeCommand,
    getCommandSuggestions,
    generateVoiceResponse
  } = useVoiceCommands()

  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setIsSupported(isVoiceSupported())
  }, [isVoiceSupported])

  const handleStartListening = async () => {
    if (!isSupported || disabled) return

    try {
      setIsListening(true)
      setError('')
      setLastResult('')

      const result = await startListening()
      setIsProcessing(true)
      
      const recognitionResult = await result
      setLastResult(recognitionResult.text)
      
      // Process the voice input
      const processedResult = processVoiceInput(recognitionResult.text, recognitionResult.confidence)
      
      // Execute the best matching command
      if (processedResult.commands.length > 0) {
        const bestCommand = processedResult.commands[0]
        const executionResult = executeCommand(bestCommand, processedResult.entities)
        
        if (executionResult.success) {
          onCommandExecuted?.(executionResult.result)
          // Generate and speak response
          const response = generateVoiceResponse(bestCommand, true)
          speakText(response)
        } else {
          setError(executionResult.error || 'Không thể thực hiện lệnh')
        }
      } else {
        // No command matched, treat as regular text input
        onVoiceInput?.(recognitionResult.text)
        speakText('Tôi đã nhận được tin nhắn của bạn.')
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Lỗi nhận diện giọng nói')
    } finally {
      setIsListening(false)
      setIsProcessing(false)
    }
  }

  const handleStopListening = () => {
    stopListening()
    setIsListening(false)
    setIsProcessing(false)
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'vi-VN'
      utterance.rate = 0.9
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  const suggestions = getCommandSuggestions()

  if (!isSupported) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
        <MicrophoneIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Trình duyệt không hỗ trợ nhận diện giọng nói</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Voice Control Button */}
      <div className="flex items-center justify-center">
        <motion.button
          onClick={isListening ? handleStopListening : handleStartListening}
          disabled={disabled || isProcessing}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white'
          } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          whileHover={{ scale: disabled || isProcessing ? 1 : 1.05 }}
          whileTap={{ scale: disabled || isProcessing ? 1 : 0.95 }}
          animate={isListening ? {
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0.4)',
              '0 0 0 10px rgba(239, 68, 68, 0)',
              '0 0 0 0 rgba(239, 68, 68, 0)'
            ]
          } : {}}
          transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
        >
          {isProcessing ? (
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <MicrophoneIcon className="w-6 h-6" />
          )}
          
          {/* Listening indicator */}
          {isListening && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          )}
        </motion.button>
      </div>

      {/* Status Display */}
      <AnimatePresence>
        {(isListening || isProcessing || lastResult || error) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center space-y-2"
          >
            {isListening && (
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 bg-amber-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-amber-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-amber-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span className="text-sm font-medium">Đang nghe...</span>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span className="text-sm font-medium">Đang xử lý...</span>
              </div>
            )}

            {lastResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Đã nhận diện:</p>
                <p className="text-sm text-green-700">"{lastResult}"</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">Lỗi:</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Lệnh giọng nói</h3>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <CommandLineIcon className="w-3 h-3" />
            {showSuggestions ? 'Ẩn' : 'Hiện'} gợi ý
          </button>
        </div>

        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600"
                >
                  "{suggestion}"
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>Nhấn và giữ để nói</p>
        <p>Nói rõ ràng và chậm rãi</p>
        <p>Hỗ trợ tiếng Việt</p>
      </div>
    </div>
  )
}

// Compact version for mobile
export function VoiceCommandsCompact({ 
  onCommandExecuted, 
  onVoiceInput,
  disabled = false 
}: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  
  const {
    isVoiceSupported,
    startListening,
    stopListening,
    processVoiceInput,
    executeCommand,
    generateVoiceResponse
  } = useVoiceCommands()

  useEffect(() => {
    setIsSupported(isVoiceSupported())
  }, [isVoiceSupported])

  const handleToggleListening = async () => {
    if (!isSupported || disabled) return

    if (isListening) {
      stopListening()
      setIsListening(false)
    } else {
      try {
        setIsListening(true)
        const result = await startListening()
        const recognitionResult = await result
        
        // Process and execute command
        const processedResult = processVoiceInput(recognitionResult.text, recognitionResult.confidence)
        
        if (processedResult.commands.length > 0) {
          const bestCommand = processedResult.commands[0]
          const executionResult = executeCommand(bestCommand, processedResult.entities)
          
          if (executionResult.success) {
            onCommandExecuted?.(executionResult.result)
            const response = generateVoiceResponse(bestCommand, true)
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(response)
              utterance.lang = 'vi-VN'
              speechSynthesis.speak(utterance)
            }
          }
        } else {
          onVoiceInput?.(recognitionResult.text)
        }
        
      } catch (error) {
        console.error('Voice recognition error:', error)
      } finally {
        setIsListening(false)
      }
    }
  }

  if (!isSupported) return null

  return (
    <motion.button
      onClick={handleToggleListening}
      disabled={disabled}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        isListening 
          ? 'bg-red-500 text-white' 
          : 'bg-amber-500 text-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={isListening ? {
        scale: [1, 1.1, 1],
        boxShadow: [
          '0 0 0 0 rgba(239, 68, 68, 0.4)',
          '0 0 0 8px rgba(239, 68, 68, 0)',
          '0 0 0 0 rgba(239, 68, 68, 0)'
        ]
      } : {}}
      transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
    >
      {isListening ? (
        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <MicrophoneIcon className="w-4 h-4" />
      )}
    </motion.button>
  )
}
