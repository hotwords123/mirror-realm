import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SymmetryMode } from '@/utils/symmetry'

export const useEditorStore = defineStore('editor', () => {
  const currentFile = ref<File | null>(null)
  const fileUrl = ref<string | null>(null)
  const isProcessing = ref(false)
  const activeMode = ref<SymmetryMode>('left-to-right')
  const processingProgress = ref(0)

  function setFile(file: File) {
    if (fileUrl.value) {
      URL.revokeObjectURL(fileUrl.value)
    }
    currentFile.value = file
    fileUrl.value = URL.createObjectURL(file)
  }

  function clearFile() {
    if (fileUrl.value) {
      URL.revokeObjectURL(fileUrl.value)
    }
    currentFile.value = null
    fileUrl.value = null
    processingProgress.value = 0
  }

  return {
    currentFile,
    fileUrl,
    isProcessing,
    activeMode,
    processingProgress,
    setFile,
    clearFile,
  }
})
