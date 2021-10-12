export type MessageIndex = {
  id: string
  chatId: number
  senderId: number
  senderName: string
  /** searchable text */
  text: string
  type: 'text' | 'image' | 'sticker' | 'document' | 'video' | 'service' | string
  raw: string
  from: 'import' | 'bot'
  timestamp: number
}
