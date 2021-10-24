import type { MessageIndex } from '../search/meili-search.service'

export type OCRMeta = {
  image: Buffer
  message: Omit<MessageIndex, 'text'>
}

export type MessageMeta = {
  message: MessageIndex
}

type QueueMetaMap = {
  ocr: OCRMeta
  message: MessageMeta
}

export type QueueTypes = keyof QueueMetaMap

export type QueueMeta<T extends QueueTypes = QueueTypes> = QueueMetaMap[T]

export type QueueProcessor<T extends QueueTypes = QueueTypes> = (
  meta: QueueMeta<T>,
) => Promise<void>
