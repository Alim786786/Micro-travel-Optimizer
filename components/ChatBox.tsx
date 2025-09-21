'use client'

import { useState } from 'react'

interface ChatBoxProps {
  onParse: (text: string) => void
  isLoading: boolean
  error: string
}

export default function ChatBox({ onParse, isLoading, error }: ChatBoxProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onParse(text.trim())
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Describe Your Day</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="I leave from 285 Yonge St at 2:40 pm, pick up my sister at Jarvis Collegiate around 3:15 (not later than 3:25), then No Frills for 20 minutes, prefer subway, and be home near Donlands by 6."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Parsing...' : 'Parse My Day'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
