import type {
  MessageIndex,
  OptionalTextMessageIndex,
} from '../search/meili-search.service'

export type Image = {
  type: 'url' | 'base64'
  data: string
}

export type OCRMeta = {
  images: Image[]
  message: OptionalTextMessageIndex
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
